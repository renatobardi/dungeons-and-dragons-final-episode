"""Restore Bobby's source detail and author less glossy skin; no Meshy operations.
Run with Blender from the repository root. Preserves editable packed .blend files.
"""
import os
import bpy
import numpy as np

for name, budget in [('right-arm-club', 160000), ('left-arm', 90000)]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=f'assets/models/bobby/{name}-raw.glb')
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=max(obj.dimensions) * 0.00015)
    bpy.ops.object.mode_set(mode='OBJECT')
    # Preserve the silhouette and carved grain instead of collapsing to the old 26k budget.
    count = sum(len(p.vertices) - 2 for p in obj.data.polygons)
    decimate = obj.modifiers.new('Preserve silhouette and grain', 'DECIMATE')
    decimate.ratio = min(1, budget / count)
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    # Continue the short source forearms towards the body, keeping wrists and grip untouched.
    # These source coordinates are Blender Z-up (glTF Y-up on export).
    for vertex in obj.data.vertices:
        if name == 'right-arm-club':
            t = max(0, min(1, (-vertex.co.z - .60) / .35))
            vertex.co.z -= .65 * t * t * (3 - 2 * t)
        else:
            t = max(0, min(1, (-vertex.co.y - .45) / .50))
            t = t * t * (3 - 2 * t)
            vertex.co.y -= .55 * t
            vertex.co.z -= .35 * t
            vertex.co.x -= .15 * t
    obj.data.validate(verbose=False)
    obj.data.update()
    for p in obj.data.polygons:
        p.use_smooth = True
    for mat in obj.data.materials:
        nodes = mat.node_tree.nodes
        shader = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
        shader.inputs['Roughness'].default_value = 0.62
        shader.inputs['Specular IOR Level'].default_value = 0.28
        images = [n for n in nodes if n.type == 'TEX_IMAGE']
        color = next(n.image for n in images if any(l.to_socket.name == 'Base Color' for l in n.outputs['Color'].links))
        # The original packed roughness is retained for metal/wood; skin gets a broader highlight.
        w,h = color.size
        rgba = np.array(color.pixels[:], dtype=np.float32).reshape(h,w,4)
        skin = (rgba[:,:,0] > .38) & (rgba[:,:,1] > .18) & (rgba[:,:,0] > rgba[:,:,1]*1.14) & (rgba[:,:,1] > rgba[:,:,2]*1.08)
        # Fine tangent-space variation breaks the waxy highlight without coarse visible speckles.
        rng = np.random.default_rng(25)
        for node in images:
            if not any(link.to_node.type == 'NORMAL_MAP' for link in node.outputs['Color'].links):
                continue
            normal = node.image
            if tuple(normal.size) != (w,h):
                continue
            pixels = np.array(normal.pixels[:], dtype=np.float32).reshape(h,w,4)
            for channel in [0,1]:
                variation = rng.normal(0, .006, (h,w))
                pixels[:,:,channel] = np.clip(pixels[:,:,channel] + variation * skin, 0, 1)
            normal.pixels.foreach_set(pixels.ravel())
            normal.pack()
        for n in images:
            if n.image == color or n.image.colorspace_settings.name != 'Non-Color':
                continue
            if not any(l.to_node.type == 'SEPARATE_COLOR' for l in n.outputs['Color'].links):
                continue
            im = n.image
            if tuple(im.size) != (w,h):
                continue
            data = np.array(im.pixels[:], dtype=np.float32).reshape(h,w,4)
            data[:,:,1] = np.where(skin, np.maximum(data[:,:,1], .64), data[:,:,1])
            data[:,:,2] = np.where(skin, 0, data[:,:,2])
            im.pixels.foreach_set(data.ravel())
            im.pack()
    os.makedirs('assets/models/bobby', exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(f'assets/models/bobby/{name}.blend'), compress=True)
    bpy.ops.export_scene.gltf(filepath=f'public/models/bobby/{name}.glb', export_format='GLB', use_selection=True, export_apply=True, export_image_format='JPEG', export_jpeg_quality=95)
    print('BOBBY FINISHED', name, sum(len(p.vertices)-2 for p in obj.data.polygons))
