"""Builds the quadruped rig for Uni and bakes her three clips into a GLB.

Runs headless: `blender --background --python scripts/rig-uni.py`. The source mesh from ticket 01 is a
single unrigged blob, so the bones are placed from the geometry itself: the four hooves are the four
lowest clusters, the body is the slab above them, and the head is the far end of the top slab.

Writes `public/models/uni/uni-rigged.glb` and the stride constant the renderer needs to keep the step
matched to the simulation, in `src/render/uni-rig-generated.ts`.
"""

import json
import math
import os
import sys

import bpy
from mathutils import Vector

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(REPO, "public/models/uni/uni.glb")
TARGET = os.path.join(REPO, "public/models/uni/uni-rigged.glb")
GENERATED = os.path.join(REPO, "src/render/uni-rig-generated.ts")

FPS = 24
WALK_FRAMES = 24  # one full gait cycle
IDLE_FRAMES = 96
ALERT_FRAMES = 48

SWING = 0.34  # radians the upper leg bones swing fore and aft while walking


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_source():
    bpy.ops.import_scene.gltf(filepath=SOURCE, merge_vertices=True)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if len(meshes) != 1:
        raise SystemExit(f"expected one mesh in {SOURCE}, found {len(meshes)}")
    mesh = meshes[0]
    mesh.name = "uniBody"  # "uni" is the scene node the game counts to catch a leaked Uni
    # the importer parents the mesh to an empty; the rig wants it standing on its own at the origin
    mesh.parent = None
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for empty in [o for o in bpy.context.scene.objects if o.type == "EMPTY"]:
        bpy.data.objects.remove(empty, do_unlink=True)
    return mesh


def anatomy(mesh):
    """Reads the landmarks the bones hang off: hooves, body, head. Blender is Z-up."""
    verts = [v.co.copy() for v in mesh.data.vertices]
    low = min(v.z for v in verts)
    high = max(v.z for v in verts)
    height = high - low

    hoof_verts = [v for v in verts if v.z < low + height * 0.11]
    clusters = []
    for v in hoof_verts:
        for c in clusters:
            centre = c["sum"] / c["n"]
            if math.hypot(centre.x - v.x, centre.y - v.y) < height * 0.14:
                c["sum"] += v
                c["n"] += 1
                break
        else:
            clusters.append({"sum": v.copy(), "n": 1})
    if len(clusters) != 4:
        raise SystemExit(f"expected four hooves, clustered {len(clusters)}")
    hooves = [c["sum"] / c["n"] for c in clusters]

    # the head is the far end of the top slab; whichever side of the body it sits on is forward
    top = [v for v in verts if v.z > low + height * 0.74]
    head = sum(top, Vector()) / len(top)
    forward = 1.0 if head.y > 0 else -1.0

    front = sorted(hooves, key=lambda h: -forward * h.y)[:2]
    back = [h for h in hooves if h not in front]
    named = {
        "FL": min(front, key=lambda h: h.x),
        "FR": max(front, key=lambda h: h.x),
        "BL": min(back, key=lambda h: h.x),
        "BR": max(back, key=lambda h: h.x),
    }

    body_z = low + height * 0.52  # belly line: where the legs meet the barrel
    knee_z = low + height * 0.24
    shoulder_y = sum(h.y for h in front) / 2
    hip_y = sum(h.y for h in back) / 2
    return {
        "low": low,
        "high": high,
        "height": height,
        "hooves": named,
        "head": head,
        "forward": forward,
        "body_z": body_z,
        "knee_z": knee_z,
        "shoulder_y": shoulder_y,
        "hip_y": hip_y,
    }


def build_armature(a):
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
    rig = bpy.context.object
    rig.name = "uniRig"
    rig.data.name = "uniRig"
    edit = rig.data.edit_bones
    edit.remove(edit[0])

    def bone(name, head, tail, parent=None):
        b = edit.new(name)
        b.head = head
        b.tail = tail
        b.use_connect = False
        if parent:
            b.parent = edit[parent]
        return b

    fwd = a["forward"]
    body_z = a["body_z"]
    bone("root", (0, 0, 0), (0, 0, a["height"] * 0.2))
    bone("spine", (0, a["hip_y"], body_z), (0, a["shoulder_y"], body_z), "root")
    neck_top = Vector((a["head"].x * 0.4, a["shoulder_y"] + fwd * a["height"] * 0.12, a["low"] + a["height"] * 0.82))
    bone("neck", (0, a["shoulder_y"], body_z), neck_top, "spine")
    bone("head", neck_top, (a["head"].x, a["head"].y + fwd * a["height"] * 0.1, neck_top.z + a["height"] * 0.06), "neck")

    for name, hoof in a["hooves"].items():
        top_y = a["shoulder_y"] if name[0] == "F" else a["hip_y"]
        top = Vector((hoof.x * 0.7, top_y, body_z))
        knee = Vector((hoof.x * 0.85, (hoof.y + top_y) / 2, a["knee_z"]))
        bone(f"leg{name}Upper", top, knee, "spine")
        bone(f"leg{name}Lower", knee, Vector((hoof.x, hoof.y, a["low"])), f"leg{name}Upper")

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def distance_to_bone(point, bone):
    """Distance from a vertex to the bone's segment, in armature space."""
    head, tail = bone.head_local, bone.tail_local
    axis = tail - head
    span = axis.length_squared
    t = 0.0 if span == 0 else max(0.0, min(1.0, (point - head).dot(axis) / span))
    return (point - (head + axis * t)).length


def bind(mesh, rig):
    """Skins the mesh by hand.

    Blender's bone heat weighting finds no solution on this mesh — it comes out of Meshy non-manifold,
    and every vertex lands unweighted. So each vertex takes the closest bone plus that bone's immediate
    neighbours in the chain, weighted by inverse distance. Limiting the blend to neighbours is what keeps
    a hind leg from dragging the belly of the opposite one.
    """
    rig.data.bones["root"].use_deform = False  # carries the body bob, deforms nothing
    deform = [b for b in rig.data.bones if b.use_deform]
    neighbours = {
        b.name: {b.name}
        | ({b.parent.name} if b.parent and b.parent.use_deform else set())
        | {c.name for c in b.children if c.use_deform}
        for b in deform
    }

    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_NAME")

    groups = {b.name: mesh.vertex_groups[b.name] for b in deform}
    for v in mesh.data.vertices:
        distances = {b.name: distance_to_bone(v.co, b) for b in deform}
        closest = min(distances, key=distances.get)
        weights = {n: 1.0 / (distances[n] + 1e-4) ** 3 for n in neighbours[closest]}
        total = sum(weights.values())
        for name, w in weights.items():
            share = w / total
            if share >= 0.02:
                groups[name].add([v.index], share, "REPLACE")
    return "computed"


def pose_bones(rig):
    for b in rig.pose.bones:
        b.rotation_mode = "XYZ"
    return {b.name: b for b in rig.pose.bones}


def key(bone, frame, rot=None, loc=None):
    if rot is not None:
        bone.rotation_euler = rot
        bone.keyframe_insert("rotation_euler", frame=frame)
    if loc is not None:
        bone.location = loc
        bone.keyframe_insert("location", frame=frame)


def bob(bones, frame, height):
    """Raises the whole body. The root bone points up, so its local Y is the world's vertical."""
    key(bones["root"], frame, loc=(0, height, 0))


def new_action(rig, name, length):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = action
    for b in rig.pose.bones:
        b.rotation_euler = (0, 0, 0)
        b.location = (0, 0, 0)
    bpy.context.scene.frame_end = length
    return action


LIFT = 0.055  # metres the swinging hoof clears the ground by
KNEE_FOLD = 0.75  # radians the knee folds at the top of the swing
# Front and hind legs came out of the sculpt a few millimetres apart in length while their hips sit on
# one line, so a square stance leaves one pair that much above the floor and the other that much below.
# It is a constant per leg, not a shimmer, and 6 mm on a 0.95 m foal does not read.
FLOAT_TOLERANCE = 0.006
LEGS = ("FL", "FR", "BL", "BR")
PHASES = {"FL": 0.0, "BR": 0.0, "FR": 0.5, "BL": 0.5}  # opposite corners move together


def leg_rest(rig, name):
    """The rest geometry each leg is posed from, in the sagittal plane (Blender Y forward, Z up)."""
    upper = rig.data.bones[f"leg{name}Upper"]
    lower = rig.data.bones[f"leg{name}Lower"]
    hip, hoof = upper.head_local, lower.tail_local
    dy, dz = hoof.y - hip.y, hoof.z - hip.z
    return {
        "hip": hip,
        "hoof": hoof,
        "length": math.hypot(dy, dz),
        "angle": math.atan2(dz, dy),
        "front": name[0] == "F",
    }


def swing_angle(rest, foot_y):
    """Upper-bone rotation that puts the hoof at `foot_y`, plus the height it ends up at.

    The knee holds its rest bend, so the leg turns about the hip as one piece: the hoof rides a circle
    of radius `length`, and asking for a Y lands it there exactly.
    """
    reach = max(-0.999, min(0.999, (foot_y - rest["hip"].y) / rest["length"]))
    # the leg hangs below the hip, so of the two solutions we keep the one pointing down
    target = -math.acos(reach) if rest["angle"] < 0 else math.acos(reach)
    return target - rest["angle"], rest["hip"].z + rest["length"] * math.sin(target)


def plant(bones, frame, rests, feet, folds=None):
    """Poses every leg to put its hoof at the asked-for Y, then settles the body onto the planted ones.

    A leg swinging clear of the floor is given `lift` instead of a Y and takes no part in holding the
    body up. Because the planted legs all stand the same distance off the vertical, dropping the body by
    what they gained keeps the hooves on the floor instead of hovering a step above it.
    """
    error = []
    for name, rest in rests.items():
        rotation, hoof_z = swing_angle(rest, feet[name]["y"])
        lift = feet[name].get("lift", 0.0)
        if lift > 0:
            rotation += lift / rest["length"]
        else:
            error.append(hoof_z - rest["hoof"].z)
        key(bones[f"leg{name}Upper"], frame, rot=(rotation, 0, 0))
        key(bones[f"leg{name}Lower"], frame, rot=((folds or {}).get(name, 0.0), 0, 0))
    return -sum(error) / len(error)


def square_stance(rests):
    """Hooves directly below their hips — the base every clip poses from."""
    return {name: {"y": rest["hip"].y} for name, rest in rests.items()}


def bake_walk(rig, a):
    """A diagonal walk whose planted hooves travel in a straight line.

    Opposite corners move together. While a hoof is down its horizontal travel is linear, so it covers
    exactly the ground the body covers and never slides; the rise a leg gains as it swings away from
    vertical is taken out of the body instead, which is where the bob comes from.
    """
    bones = pose_bones(rig)
    new_action(rig, "walk", WALK_FRAMES)
    rests = {name: leg_rest(rig, name) for name in LEGS}
    half = foot_excursion(rig) / 2
    fwd = a["forward"]

    for f in range(WALK_FRAMES + 1):
        feet, folds = {}, {}
        for name, offset in PHASES.items():
            rest = rests[name]
            p = ((f / WALK_FRAMES) + offset) % 1.0
            if p < 0.5:  # stance: the hoof is on the floor, travelling back under the body
                feet[name] = {"y": rest["hip"].y + fwd * half * (1 - 4 * p)}
            else:  # swing: back to the front, folded at the knee so it clears the floor
                u = (p - 0.5) * 2
                feet[name] = {"y": rest["hip"].y + fwd * half * (2 * u - 1), "lift": LIFT * math.sin(math.pi * u)}
                folds[name] = KNEE_FOLD * math.sin(math.pi * u) * (-fwd if rest["front"] else fwd)
        bob(bones, f, plant(bones, f, rests, feet, folds))

        # the spine stays put: swaying it would carry the hips, and with them the planted hooves
        t = 2 * math.pi * f / WALK_FRAMES
        key(bones["neck"], f, rot=(math.sin(t) * 0.03, 0, 0))
        key(bones["head"], f, rot=(math.sin(t + 1.0) * 0.04, 0, 0))


def bake_idle(rig, a):
    """Standing square, breathing."""
    bones = pose_bones(rig)
    new_action(rig, "idle", IDLE_FRAMES)
    rests = {name: leg_rest(rig, name) for name in LEGS}
    stance = square_stance(rests)
    for f in range(IDLE_FRAMES + 1):
        t = 2 * math.pi * f / IDLE_FRAMES
        bob(bones, f, plant(bones, f, rests, stance) + math.sin(t) * a["height"] * 0.004)
        key(bones["spine"], f, rot=(math.sin(t) * 0.012, 0, 0))
        key(bones["neck"], f, rot=(math.sin(t + 0.7) * 0.03, 0, 0))
        key(bones["head"], f, rot=(math.sin(t * 2 + 0.3) * 0.05, 0, math.sin(t * 0.5) * 0.06))


def bake_alert(rig, a):
    """Head up, neck stiff, one front hoof pawing the floor — the pose that reads as a warning."""
    bones = pose_bones(rig)
    new_action(rig, "alert", ALERT_FRAMES)
    rests = {name: leg_rest(rig, name) for name in LEGS}
    stance = square_stance(rests)
    fwd = a["forward"]
    for f in range(ALERT_FRAMES + 1):
        t = 2 * math.pi * f / ALERT_FRAMES
        rise = min(1.0, f / 6.0)
        paw = max(0.0, math.sin(t * 2)) * rise
        feet = dict(stance)
        feet["FL"] = {"y": stance["FL"]["y"] - fwd * 0.1 * paw, "lift": LIFT * 1.6 * paw}
        folds = {"FL": KNEE_FOLD * paw * -fwd}
        bob(bones, f, plant(bones, f, rests, feet, folds) + math.sin(t * 2) * a["height"] * 0.006)
        key(bones["neck"], f, rot=(-0.42 * rise * fwd, 0, 0))
        key(bones["head"], f, rot=((-0.22 * rise + math.sin(t * 3) * 0.05) * fwd, 0, 0))
        key(bones["spine"], f, rot=(-0.05 * rise * fwd, 0, 0))


def foot_excursion(rig):
    """How far a hoof travels fore to aft, which is the ground it covers during its half of the cycle."""
    legs = [leg_rest(rig, name) for name in LEGS]
    return 2 * (sum(l["length"] for l in legs) / len(legs)) * math.sin(SWING)


def stride_metres(rig):
    """How far the body advances over one gait cycle.

    Each hoof is down for half the cycle and covers its whole excursion in that time, and the two
    diagonals take turns, so the body travels two excursions per cycle. This is the number the renderer
    divides distance by to decide which frame of the clip to show.
    """
    return 2 * foot_excursion(rig)


def verify_walk(rig):
    """Fails the build if a planted hoof slides or floats.

    Over one cycle each hoof spends half its time on the floor, and while it is down it must cover
    exactly the ground the body covers — otherwise the step looks skated. Checked here rather than in a
    test because it is a property of the asset this script writes. Runs straight after the walk bake, so
    the walk is the pose the rig is holding.
    """
    scene = bpy.context.scene
    step = stride_metres(rig) / WALK_FRAMES
    ground = min(leg_rest(rig, name)["hoof"].z for name in LEGS)

    tracks = {name: [] for name in LEGS}
    for f in range(WALK_FRAMES + 1):
        scene.frame_set(f)
        for name in LEGS:
            tail = rig.pose.bones[f"leg{name}Lower"].tail
            tracks[name].append((tail.y, tail.z))

    for name, track in tracks.items():
        planted = [i for i in range(WALK_FRAMES) if ((i / WALK_FRAMES) + PHASES[name]) % 1.0 < 0.5 - 1e-9]
        if len(planted) != WALK_FRAMES // 2:
            raise SystemExit(f"{name} is down for {len(planted)} of {WALK_FRAMES} frames, not half of them")
        for i in planted:
            travel = abs(track[i + 1][0] - track[i][0])
            if abs(travel - step) > step * 0.02:
                raise SystemExit(f"{name} hoof slides at frame {i}: moved {travel:.4f} m, body moved {step:.4f} m")
            if abs(track[i][1] - ground) > FLOAT_TOLERANCE:
                raise SystemExit(f"{name} hoof floats at frame {i}: {track[i][1] - ground:.4f} m off the floor")


def export(rig, mesh):
    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(
        filepath=TARGET,
        export_format="GLB",
        use_selection=True,
        export_animation_mode="ACTIONS",
        export_materials="NONE",
        export_skins=True,
        export_yup=True,
        export_apply=False,
        export_bake_animation=False,
        export_optimize_animation_size=False,
    )


def write_generated(rig, weights):
    stride = stride_metres(rig)
    body = f"""// Generated by scripts/rig-uni.py — do not edit by hand.
// Rig bound with {weights} weights from public/models/uni/uni.glb.

/** Metres Uni's body advances over one full cycle of the baked walk clip. */
export const UNI_STRIDE_METRES = {stride:.4f};

/** Seconds of one full cycle of the baked walk clip. */
export const UNI_WALK_CYCLE_SECONDS = {WALK_FRAMES / FPS:.4f};
"""
    with open(GENERATED, "w", encoding="utf-8") as f:
        f.write(body)


def main():
    clear_scene()
    bpy.context.scene.render.fps = FPS
    mesh = import_source()
    a = anatomy(mesh)
    rig = build_armature(a)
    weights = bind(mesh, rig)
    bake_walk(rig, a)
    verify_walk(rig)
    bake_idle(rig, a)
    bake_alert(rig, a)
    export(rig, mesh)
    write_generated(rig, weights)
    print(json.dumps({"target": TARGET, "weights": weights, "stride": round(stride_metres(rig), 4)}))


main()
