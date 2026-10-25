import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),assets=path.join(root,'assets');
const model=fs.readFileSync(path.join(assets,'star_fortune_v2.glb')).toString('base64');
const fallback='data:image/png;base64,'+fs.readFileSync(path.join(assets,'model_studio.png')).toString('base64');
const bundle=await build({entryPoints:['app.js'],bundle:true,minify:true,write:false,format:'iife',target:['chrome110','edge110'],legalComments:'eof',define:{__MODEL_BASE64__:JSON.stringify(model),__FALLBACK_IMAGE__:JSON.stringify(fallback)}});
const html=fs.readFileSync('index.template.html','utf8').replace('/*__STYLE__*/',()=>fs.readFileSync('style.css','utf8')).replace('/*__SCRIPT__*/',()=>bundle.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
fs.mkdirSync('output',{recursive:true});fs.writeFileSync('output/index.html',html);console.log('Desktop site built:',Buffer.byteLength(html),'bytes; all runtime assets embedded.');
