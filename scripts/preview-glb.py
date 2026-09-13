"""Render a turntable-style preview of a GLB so a generated asset can be judged before it is used.

Blender runs headless here; the producer does not drive it by hand. Usage:

    pnpm blender -- scripts/preview-glb.py -- <model.glb> <out.png> [angle-degrees]
"""

import math
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--", sys.argv.index("--") + 1) + 1 :] if sys.argv.count("--") > 1 else sys.argv[sys.argv.index("--") + 1 :]
model_path, out_path = argv[0], argv[1]
angle = math.radians(float(argv[2])) if len(argv) > 2 else math.radians(35)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=model_path)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if not meshes:
    raise SystemExit(f"no mesh in {model_path}")

# frame every imported mesh, whatever scale it came out at
corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
low = Vector((min(c.x for c in corners), min(c.y for c in corners), min(c.z for c in corners)))
high = Vector((max(c.x for c in corners), max(c.y for c in corners), max(c.z for c in corners)))
centre = (low + high) / 2
radius = max((high - low).length / 2, 1e-3)

cam_data = bpy.data.cameras.new("preview")
cam = bpy.data.objects.new("preview", cam_data)
bpy.context.scene.collection.objects.link(cam)
distance = radius * 3.2
cam.location = centre + Vector((math.sin(angle) * distance, -math.cos(angle) * distance, radius * 0.8))
direction = centre - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = cam

key = bpy.data.objects.new("key", bpy.data.lights.new("key", type="AREA"))
key.data.energy = 800 * radius * radius
key.data.size = radius * 2
key.location = centre + Vector((radius * 2, -radius * 2.5, radius * 2.5))
key.rotation_euler = (centre - key.location).to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.collection.objects.link(key)

world = bpy.data.worlds.new("preview")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.05, 0.05, 0.06, 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.2
bpy.context.scene.world = world

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.filepath = out_path
scene.render.image_settings.file_format = "PNG"
bpy.ops.render.render(write_still=True)
print(f"PREVIEW {out_path} radius={radius:.3f} tris={sum(len(o.data.loop_triangles) or len(o.data.polygons) for o in meshes)}")
