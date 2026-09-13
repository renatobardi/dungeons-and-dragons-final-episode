"""Turn a raw Meshy generation into an asset the browser can load.

Meshy returns roughly two million triangles and 2K PBR maps — around 60 MB per piece, which is more
than the whole game downloads today. This does the finishing pass the production notes call for:
drops the scraps the reference crop dragged in, decimates to a budget, shrinks the maps and writes a
GLB next to the ones the kit already uses.

Blender runs headless; the producer does not drive it by hand. Usage:

    pnpm blender -- scripts/finish-model.py -- <raw.glb> <out.glb> [tris] [texture-size]
"""

import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :]
raw_path, out_path = argv[0], argv[1]
target_tris = int(argv[2]) if len(argv) > 2 else 24000
texture_size = int(argv[3]) if len(argv) > 3 else 1024

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=raw_path)

meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
if not meshes:
    raise SystemExit(f"no mesh in {raw_path}")

# one object, so the loose-part pass sees the whole generation at once
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
obj.name = "asset"

# The crops are taken from a lit scene, so a generation can carry a chip of floor or a shard of the
# background along with the subject. Splitting by loose parts and keeping only what is a real
# fraction of the biggest piece removes those without touching the subject.
bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.separate(type="LOOSE")
bpy.ops.object.mode_set(mode="OBJECT")

parts = [o for o in bpy.context.scene.objects if o.type == "MESH"]
total = sum(len(p.data.vertices) for p in parts)
# Only genuine specks go. Measuring against the biggest part instead threw away every strand of a
# mane — hundreds of small pieces that are the subject, not scraps — and left holes where they had
# been welded to the body.
floor = max(8, total * 0.0001)
kept = [p for p in parts if len(p.data.vertices) >= floor]
for p in parts:
    if p not in kept:
        print(f"DROP loose part {p.name} with {len(p.data.vertices)} vertices")
        bpy.data.objects.remove(p, do_unlink=True)

bpy.ops.object.select_all(action="DESELECT")
for p in kept:
    p.select_set(True)
bpy.context.view_layer.objects.active = kept[0]
if len(kept) > 1:
    bpy.ops.object.join()
obj = bpy.context.view_layer.objects.active
obj.name = "asset"

tris = sum(len(poly.vertices) - 2 for poly in obj.data.polygons)
if tris > target_tris:
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.ratio = target_tris / tris
    bpy.ops.object.modifier_apply(modifier=mod.name)
final_tris = sum(len(poly.vertices) - 2 for poly in obj.data.polygons)

for image in bpy.data.images:
    if image.size[0] > texture_size or image.size[1] > texture_size:
        image.scale(texture_size, texture_size)

bpy.ops.object.select_all(action="DESELECT")
obj.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
)
print(f"FINISHED {out_path} tris={tris}->{final_tris} textures={texture_size}")
