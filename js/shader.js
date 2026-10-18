"use strict";
/**
 * Fragment shader for the 3D background.
 * Ray-marches a ring of glass orbs that merges into a blob and then a card.
 * Uniforms are set from webgl.ts (position, scale, shape weights, intensity).
 */
const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 uRes;uniform float uT;uniform vec4 uPos;uniform vec3 uW;uniform float uRot;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float sdBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}
float map(vec3 p){
 float R=mix(.16,1.12,uW.x);float sr=mix(.58,.3,uW.x);float d=1e4;
 for(int i=0;i<8;i++){
  float fi=float(i);float a=fi*.7853982+uT*.28;
  vec3 c=vec3(cos(a)*R,sin(a)*R,sin(uT*.8+fi*1.7)*.14);
  c.xy+=vec2(sin(uT*.6+fi*2.1),cos(uT*.5+fi*1.3))*.14*(1.-uW.x);
  d=smin(d,length(p-c)-sr,mix(.55,.1,uW.x));
 }
 float slab=sdBox(p,vec3(1.3,.82,.05),.09);
 return mix(d,slab,uW.y);
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
 float asp=uRes.x/uRes.y;float ra=mix(uRot,.35*sin(uT*.4),uW.y);
 vec3 ro=vec3(0.,0.,5.);vec3 rd=normalize(vec3(uv,-1.7));
 vec3 off=vec3(uPos.x*1.47*asp,uPos.y*1.47,0.);
 float sc=uPos.z;float t=0.;float glow=0.;float hit=0.;vec3 p;
 for(int i=0;i<60;i++){
  p=ro+rd*t;
  vec3 q=(p-off)/sc;
  q.xz*=rot(ra);q.yz*=rot(.32+.18*sin(uT*.3)-uW.y*.25);
  float d=map(q)*sc;
  glow+=exp(-max(d,0.)*3.2)*.018;
  if(d<.002){hit=1.;break;}
  t+=d*.9;if(t>10.)break;
 }
 vec3 col=vec3(0.);
 if(hit>.5){
  vec3 q=(p-off)/sc;q.xz*=rot(ra);q.yz*=rot(.32+.18*sin(uT*.3)-uW.y*.25);
  vec2 e=vec2(.003,0.);
  vec3 n=normalize(vec3(map(q+e.xyy)-map(q-e.xyy),map(q+e.yxy)-map(q-e.yxy),map(q+e.yyx)-map(q-e.yyx)));
  n.yz*=rot(-(.32+.18*sin(uT*.3)-uW.y*.25));n.xz*=rot(-ra);
  vec3 v=-rd;
  float fr=pow(1.-max(dot(n,v),0.),3.);
  vec3 c1=vec3(.03,.58,.66),c2=vec3(.07,.2,.9),c3=vec3(.58,.2,.92);
  vec3 base=mix(mix(c1,c2,n.x*.5+.5),c3,n.y*.5+.5);base=mix(base,mix(c1,c2,smoothstep(-1.4,1.4,q.x*.9+q.y*.5)),uW.y);
  vec3 L=normalize(vec3(-.4,.7,.6));
  float df=max(dot(n,L),0.);float sp=pow(max(dot(reflect(-L,n),v),0.),48.);
  col=base*(.1+.5*df)+base*fr*1.5+sp*.85;
 }
 col+=glow*vec3(.12,.25,1.)*.9;
 col*=uPos.w;
 col+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
 gl_FragColor=vec4(col,1.);
}
`;
//# sourceMappingURL=shader.js.map