"""Author one south-wall chapel bay in Blender; preserve the existing level footprint.
Run from the repository root. Texture provenance is in assets/materials/chapel/sources.json.
"""
import bpy
import math
import os
import random

bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(27)

def material(name, asset):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    tree=mat.node_tree; shader=tree.nodes.get('Principled BSDF')
    shader.inputs['Metallic'].default_value=0
    shader.inputs['Specular IOR Level'].default_value=.24
    for kind in ['Diffuse','nor_gl','arm']:
        path=f'assets/materials/chapel/{asset}_{kind}.jpg'
        if not os.path.exists(path): path=f'assets/materials/chapel/{asset}_diff.jpg'
        node=tree.nodes.new('ShaderNodeTexImage'); node.image=bpy.data.images.load(path,check_existing=True)
        if kind=='Diffuse':
            tree.links.new(node.outputs['Color'],shader.inputs['Base Color'])
        elif kind=='nor_gl':
            node.image.colorspace_settings.name='Non-Color'
            normal=tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.55
            tree.links.new(node.outputs['Color'],normal.inputs['Color']);tree.links.new(normal.outputs['Normal'],shader.inputs['Normal'])
        else:
            node.image.colorspace_settings.name='Non-Color'
            split=tree.nodes.new('ShaderNodeSeparateColor');tree.links.new(node.outputs['Color'],split.inputs['Color'])
            tree.links.new(split.outputs['Green'],shader.inputs['Roughness'])
    return mat

stone=material('Chapel cut limestone','rock_surface')
wall=material('Chapel weathered ashlar','rock_surface')
floor=material('Chapel worn paving','monastery_stone_floor')
iron=bpy.data.materials.new('Chapel forged iron');iron.use_nodes=True
shader=iron.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(.09,.075,.06,1)
shader.inputs['Metallic'].default_value=.8
shader.inputs['Roughness'].default_value=.7

def uv_metres(obj, tile=2):
    """Project each face using metric coordinates, never stretch an atlas to a pillar."""
    # Joining meshes keeps layers by name: every piece must use exactly one common layer.
    while obj.data.uv_layers:
        obj.data.uv_layers.remove(obj.data.uv_layers[0])
    uv=obj.data.uv_layers.new(name='MetricUV')
    bpy.context.view_layer.update()
    for face in obj.data.polygons:
        normal=face.normal
        drop=max(range(3),key=lambda i:abs(normal[i]))
        axes=([1,2],[0,2],[0,1])[drop]
        for loop in face.loop_indices:
            co=obj.matrix_world @ obj.data.vertices[obj.data.loops[loop].vertex_index].co
            uv.data[loop].uv=(co[axes[0]]/tile,co[axes[1]]/tile)

def finish(obj,mat,bevel=0):
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Worn stone edges','BEVEL');mod.width=bevel;mod.segments=3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    uv_metres(obj)
    obj.data.materials.clear();obj.data.materials.append(mat)
    return obj

def box(name,location,scale,mat=stone,bevel=.018):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location)
    obj=bpy.context.object;obj.name=name;obj.dimensions=scale
    return finish(obj,mat,bevel)

def tube(name,points,radius,mat=stone):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=2
    curve.bevel_depth=radius;curve.bevel_resolution=3
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    return finish(bpy.context.object,mat)

def lathe(name,x,y,profile):
    n=64;verts=[];faces=[]
    for z,radius in profile:
        for i in range(n):
            a=i*math.tau/n;verts.append((x+radius*math.cos(a),y+radius*math.sin(a),z))
    for row in range(len(profile)-1):
        for i in range(n):
            j=(i+1)%n;faces.append((row*n+i,row*n+j,(row+1)*n+j,(row+1)*n+i))
    faces += [tuple(reversed(range(n))),tuple((len(profile)-1)*n+i for i in range(n))]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
    finish(obj,stone)
    for p in mesh.polygons:p.use_smooth=len(p.vertices)==4
    return obj

# A six-metre bay on the south wall, with a real clerestory opening in its upper courses.
for row in range(18):
    z=.25+row*.5
    for col in range(9):
        left=-3+col*.75-(.375 if row%2 else 0)
        right=min(3,left+.75)
        left=max(-3,left)
        if right-left<.05:continue
        spans=[(left,right)]
        if 5.3<z<8.65:
            half=1.08 if z<7.45 else max(0, 1.08*(1-((z-.25-7.2)/1.38)**(1/.72)))
            spans=[(left,min(right,-half)),(max(left,half),right)]
        for lo,hi in spans:
            if hi-lo<.025:continue
            obj=box('Ashlar course',((lo+hi)/2,.025,z),(hi-lo-.015,.16+rng.uniform(0,.025),.48),wall,.012+rng.random()*.009)
            obj.rotation_euler[1]=rng.uniform(-.006,.006)

# Plinth and string courses separate large architectural volumes.
for z,width in [(.12,.25),(3.98,.28),(5.22,.30),(8.95,.34)]:
    box('Moulded wall course',(0,.07,z),(6,width,.13),stone,.022)

for x in [-2.5,2.5]:
    # Exact existing column footprint: width <= .8 m, height 4 m.
    box('Column square plinth',(x,.44,.12),(.78,.78,.24),stone,.025)
    profile=[(.24,.36),(.29,.37),(.35,.33),(.40,.34),(.45,.28),(.52,.27),
             (.96,.267),(.97,.254),(.985,.267),(1.42,.263),(1.43,.25),(1.445,.263),
             (1.88,.257),(1.89,.244),(1.905,.257),(2.34,.251),(2.35,.238),(2.365,.251),
             (2.85,.245),(2.88,.28),(2.94,.29),(3.00,.27),(3.48,.29),
             (3.53,.33),(3.60,.36),(3.67,.37),(3.73,.34),(3.79,.38),(3.9,.38),(4,.34)]
    lathe('Carved column',x,.44,profile)
    # Pointed carved arcades and leaf forms around the capital; geometry, not a painted motif.
    for i in range(8):
        theta=i*math.tau/8
        pts=[]
        for j in range(17):
            t=-1+2*j/16;a=theta+t*.30
            z=3.07+.35*(1-abs(t))**.7;r=.295
            pts.append((x+r*math.cos(a),.44+r*math.sin(a),z))
        tube('Capital carved arcade',pts,.015)
        for sign in [-1,1]:
            pts=[]
            for j in range(11):
                t=j/10;a=theta+sign*.18*math.sin(math.pi*t)
                r=.300+.035*math.sin(math.pi*t)
                pts.append((x+r*math.cos(a),.44+r*math.sin(a),3.08+.20*t))
            tube('Capital leaf',pts,.012)
    # Solid curled leaves give the capital depth and a readable carved silhouette.
    for i in range(8):
        angle=i*math.tau/8
        verts=[];faces=[]
        for row in range(13):
            t=row/12
            width=.13*math.sin(math.pi*t)**.7+.006
            radius=.29+.075*math.sin(math.pi*t)+.035*t
            for col in range(7):
                u=-1+col/3
                a=angle+u*width/.30
                r=radius+.027*(1-u*u)*math.sin(math.pi*t)
                verts.append((x+r*math.cos(a),.44+r*math.sin(a),3.02+.49*t))
        for row in range(12):
            for col in range(6):
                k=row*7+col;faces.append((k,k+1,k+8,k+7))
        mesh=bpy.data.meshes.new('Acanthus leaf');mesh.from_pydata(verts,[],faces);mesh.update()
        leaf=bpy.data.objects.new('Acanthus leaf',mesh);bpy.context.collection.objects.link(leaf)
        bpy.context.view_layer.objects.active=leaf
        solid=leaf.modifiers.new('Carved leaf thickness','SOLIDIFY');solid.thickness=.025
        bpy.ops.object.modifier_apply(modifier=solid.name)
        finish(leaf,stone)
        for face in leaf.data.polygons:face.use_smooth=True
    # Bundled shafts continue upwards, framing the high window.
    for offset in [-.16,0,.16]:
        lathe('Upper bundled shaft',x+offset,.12,[(4,.065),(8.96,.065)])

# Load-bearing pointed arch: separate wedge stones with recessed mortar joints.
def arch_height(t):
    return 3.94+1.20*(1-abs(t))**.72
for i in range(32):
    a=-1+2*(i+.045)/32;b=-1+2*(i+.955)/32
    verts=[]
    for depth in [.13,.62]:
        verts.extend([(2.5*a,depth,arch_height(a)),(2.5*b,depth,arch_height(b)),
                      (2.5*b,depth,arch_height(b)+.24),(2.5*a,depth,arch_height(a)+.24)])
    faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    mesh=bpy.data.meshes.new('Arch voussoir');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new('Arch voussoir',mesh);bpy.context.collection.objects.link(obj)
    finish(obj,stone,.008)
for depth in [.18,.58]:
    tube('Arch border',[(2.5*t,depth,arch_height(t)+.26) for t in [-1+2*i/100 for i in range(101)]],.035)

# Gothic window jambs and concentric pointed mouldings.
for x in [-1.01,1.01]:
    box('Window reveal',(x,.12,6.25),(.16,.33,1.98),stone,.018)
for radius,depth in [(1.01,.28),(1.10,.19),(1.19,.10)]:
    pts=[]
    for j in range(41):
        t=-1+2*j/40
        pts.append((radius*t,depth,7.2+1.38*(1-abs(t))**.72))
    tube('Pointed window moulding',pts,.055)
box('Window mullion',(0,.20,6.94),(.07,.12,3.18),stone,.012)
for side in [-1,1]:
    pts=[(side*(.5+.44*t),.21,7.15+.65*(1-abs(t))**.72) for t in [-1+2*j/24 for j in range(25)]]
    tube('Window tracery',pts,.033)

# A stone pedestal gives the existing gargoyle a grounded silhouette.
box('Statue foot',(0,.53,.14),(1.25,1.00,.28),stone,.026)
box('Statue pedestal',(0,.50,.55),(1.02,.84,.55),stone,.022)
box('Statue cornice',(0,.53,.88),(1.22,1.02,.15),stone,.025)
for x in [-.33,0,.33]:
    pts=[(x+.13*t,.943,.33+.40*(1-abs(t))**.72) for t in [-1+2*j/20 for j in range(21)]]
    tube('Pedestal carved arch',pts,.014)

before=set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath='assets/models/cenotaph/gargoyle-raw.glb',import_shading='NORMALS')
statues=[o for o in bpy.context.scene.objects if o not in before and o.type=='MESH']
for obj in statues:
    obj.parent=None;obj.rotation_mode="XYZ";obj.rotation_euler=(0,0,0)
    if len(obj.data.polygons)>160000:
        bpy.context.view_layer.objects.active=obj
        dec=obj.modifiers.new('Preserve sculpted silhouette','DECIMATE');dec.ratio=160000/len(obj.data.polygons)
        bpy.ops.object.modifier_apply(modifier=dec.name)
    factor=1.8/obj.dimensions.z;obj.scale=(factor,)*3
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    low=min(v.co.z for v in obj.data.vertices)
    obj.location=(0,.52,.97-low)
    obj.rotation_euler.z=math.pi
    finish(obj,stone)

# Wall-mounted wrought-iron bracket supporting the runtime torch.
box('Sconce backplate',(-1.85,.18,2.28),(.15,.08,.45),iron,.015)
tube('Sconce arm',[(-1.85,.20,2.15),(-1.85,.40,2.10),(-1.85,.78,2.25)],.035,iron)

# Thin paving overlay: visual finish only, no new step or collision.
for row in range(4):
    for col in range(8):
        box('Worn paving',(-2.625+col*.75,.45+row*.72,-.005),(.737,.707,.02),floor,.007)

bpy.ops.object.select_all(action='SELECT')
# Merge by material to keep the detailed bay to four draw calls.
for mat in [stone,wall,floor,iron]:
    group=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==mat]
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:o.select_set(True)
    bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
    bpy.context.object.name=mat.name
bpy.ops.object.select_all(action='SELECT')
for image in bpy.data.images:
    if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('assets/models/cenotaph/chapel-study.blend'),compress=True)
bpy.ops.export_scene.gltf(filepath='public/models/cenotaph/chapel-study.glb',export_format='GLB',use_selection=True,export_apply=True,export_image_format='JPEG',export_jpeg_quality=92)
