import * as THREE from 'three';
import {MeshSurfaceSampler} from 'three/addons/math/MeshSurfaceSampler.js';

// Real geometry fibers, attached to each animated body part. No remote textures.
export function plushify(root,software=false){
 const bend={value:new THREE.Vector2()},time={value:0};let count=0,parts=0;
 const meshes=[];root.traverse(n=>{if(n.isMesh&&/^(Mascot(Hood|Suit$|Sleeve|Mitten|Boot)|CloudPuff)/.test(n.name))meshes.push(n);});
 for(const mesh of meshes){
  mesh.material=mesh.material.clone();mesh.material.roughness=1;mesh.material.metalness=0;mesh.material.envMapIntensity=.25;
  const geometry=mesh.geometry;geometry.computeBoundingBox();const size=new THREE.Vector3();geometry.boundingBox.getSize(size);const length=Math.max(size.x,size.y,size.z)*(/Hood|Puff|Suit$/.test(mesh.name)?.028:.05);
  const amount=software?(/Hood|Suit$/.test(mesh.name)?1700:650):(/Hood|Suit$/.test(mesh.name)?4400:1600);
  const material=new THREE.MeshStandardMaterial({color:mesh.material.color,roughness:1,metalness:0,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{shader.uniforms.uFurBend=bend;shader.uniforms.uFurTime=time;shader.vertexShader='uniform vec2 uFurBend;\nuniform float uFurTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float tip=pow(uv.y,2.0);float wave=sin(uFurTime*2.3+instanceMatrix[3].x*27.0+instanceMatrix[3].z*19.0);
   transformed.x += (uFurBend.x*2.4+wave*0.16)*tip;
   transformed.z += (uFurBend.y*2.4+wave*0.1)*tip;`);};
  material.customProgramCacheKey=()=> 'plush-fibers-v1';
  const fibers=new THREE.InstancedMesh(new THREE.CylinderGeometry(.035,.18,1,4,1,false),material,amount);fibers.name='PlushFibers_'+mesh.name;fibers.castShadow=false;fibers.receiveShadow=true;fibers.frustumCulled=false;
  const sampler=new MeshSurfaceSampler(mesh).build(),point=new THREE.Vector3(),normal=new THREE.Vector3(),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),color=new THREE.Color();
  for(let i=0;i<amount;i++){sampler.sample(point,normal);const len=length*(.65+Math.random()*.7);dummy.position.copy(point).addScaledVector(normal,len*.44);dummy.quaternion.setFromUnitVectors(up,normal);dummy.scale.set(len,len,len);dummy.updateMatrix();fibers.setMatrixAt(i,dummy.matrix);color.copy(mesh.material.color).multiplyScalar(.86+Math.random()*.25);fibers.setColorAt(i,color);}
  mesh.add(fibers);count+=amount;parts++;
 }
 let previous=null,velocity=new THREE.Vector2();
 return {count,parts,bend:bend.value,update(dt,clock,camera,reduced,travel=0){const yaw=Math.atan2(camera.position.x,camera.position.z);let delta=previous===null?0:yaw-previous;delta=Math.atan2(Math.sin(delta),Math.cos(delta));previous=yaw;const target=new THREE.Vector2(reduced?0:THREE.MathUtils.clamp(-delta/Math.max(dt,.016)*.22-travel*.8,-.7,.7),reduced?0:Math.sin(clock*.7)*.05);const step=Math.min(dt,.04);velocity.addScaledVector(target.clone().sub(bend.value),42*step);velocity.multiplyScalar(Math.exp(-8*step));bend.value.addScaledVector(velocity,step);time.value=reduced?0:clock;}};
}
