// import * as pppppppp from "paper"
// import Stats from "three/examples/jsm/libs/stats.module"

require("../public/style.css")
let Stats 
if(process.env.DEV){
  Stats = require("stats.js")
}

import { ifExistsAElseB, loop } from "./utils/utils"
import { Vec as Vec2, Vec3, Vec4, sin, cos } from "utils/wmath"
import { QuadVerts, CubeVerts, Shader, Thing, UniformBuffer, VertexBuffer, WrightGPU, Texture, ComputeProgram, StorageBuffer, FrameBuffer } from "utils/wgpu"
import { Clock } from "utils/wutils"
import { BindGroup } from "utils/wbindgroup"
import { mat3Inverse, mat4Transpose, Matrix4, Vector4 } from "@0b5vr/experimental"
import { Camera } from "utils/wcamera"
import { Vector3 } from "@0b5vr/experimental"
import { IO } from "utils/wio"



export class Sketch {

  get width(){return Sketch.wgpu.width}
  get height(){return Sketch.wgpu.height}

  static wgpu: WrightGPU

  static clock: Clock
  static camera: Camera
  static io: IO

  // @ts-ignore
  stats: Stats

  render?: Function
  updateShit?: Function
  callbacks: Function[] = []

  static sharedUBO: UniformBuffer
  static cameraUBO: UniformBuffer

  static sharedBindGroup: BindGroup

  // ⬆ 
  async updateSharedUniforms() {
    Sketch.sharedUBO.setUniform("resolution", new Vec2(this.width, this.height))
    Sketch.sharedUBO.setUniform("time",Sketch.clock.time )
    // // Sketch.sharedUniforms.set("u_deltaTime",this.deltaTime )
    Sketch.sharedUBO.setUniform("deltaTime", Sketch.clock.deltaTime )
    Sketch.sharedUBO.setUniform("frame", Sketch.clock.frame)
    Sketch.sharedUBO.setUniform("mouse", new Vector4([ Sketch.io.mouse.x, Sketch.io.mouse.y, Number(Sketch.io.mouse.down), Number(Sketch.io.mouse.click)])) 
    Sketch.sharedUBO.update()

    Sketch.cameraUBO.setUniform("view", Sketch.camera.viewMatrix)
    // Sketch.cameraUBO.setUniform("view", new Matrix4( mat4Transpose(Sketch.camera.viewMatrix.elements)))
    Sketch.cameraUBO.setUniform("projection",Sketch.camera.projMatrix)
    Sketch.cameraUBO.setUniform("inverseView",Sketch.camera.inverseViewMatrix)
    Sketch.cameraUBO.setUniform("position",Sketch.camera.position)
    Sketch.cameraUBO.setUniform("near",Sketch.camera.near)
    Sketch.cameraUBO.setUniform("far",Sketch.camera.far)
    Sketch.cameraUBO.update()
  }

  // 🔧 
  constructor() {
    console.log("aaa")
    // document.body.style.margin = "0"
    // document.body.style.padding = "0"
    // document.body.style.overflow = "hidden"
    const canvas = document.createElement("canvas")
    canvas.id = "canvas"
    // canvas.style.position = 'fixed'
    // canvas.style.left = '0'
    // canvas.style.top = '0'

    document.body.appendChild(canvas)

    Sketch.camera = new Camera()
    Sketch.camera.pilot = true

    Sketch.clock = new Clock()
    Sketch.io = new IO()
    // Sketch.wgpu = new WrightGPU(document.querySelectorAll("canvas")[0])
    Sketch.wgpu = new WrightGPU(canvas)
  }

  // 🔥 
  init = async () => {
    await Sketch.wgpu.initializeGPU()
    
    Sketch.sharedBindGroup = new BindGroup([
      Sketch.sharedUBO = new UniformBuffer(),
      Sketch.cameraUBO = new UniformBuffer(),
    ])

    this.setup()

    const texResx = this.width
    const texResy = this.height
    const texArr: Vector4 [][] = []
    for(let i = 0; i < texResy; i++){
      const rowArr = []
      for(let i = 0; i < texResx; i++){
        rowArr.push(new Vector4([1,0,0,1]))
      }
      texArr.push(rowArr)
    }
    // const tex = Texture.fromArray({data: texArr})
    const tex = new Texture({format: "rgba8unorm"})


    const canvasFb = new FrameBuffer({depth: true, format: "rgba8unorm"})

    // const canvasFb = new FrameBuffer({depth: true})
    // const quadBuff = new VertexBuffer({bufferDataArray: QuadVerts, pads: [3,2]})

    // const storageBuff = new StorageBuffer().create(this.width * this.height * 4)
    // const storageBuff = new StorageBuffer().create(this.width * this.height * 4)

    const particleCnt = 100000
    const particleBuff = new StorageBuffer().create(particleCnt)
    const histogramBuff = new StorageBuffer().create(this.width * this.height)
    particleBuff.mappedArr.forEach((val, idx)=>{
      particleBuff.mappedArr[idx] = 0
    })
    histogramBuff.mappedArr.forEach((val, idx)=>{
      histogramBuff.mappedArr[idx] = 0 
    })

    particleBuff.uploadMapped()
    histogramBuff.uploadMapped()

    const uniBuffTest = new UniformBuffer()
    uniBuffTest.setUniform("a", 1)
    uniBuffTest.setUniform("b", 0)
    uniBuffTest.setUniform("c", 1)
    uniBuffTest.setUniform("d", 0)
    uniBuffTest.setUniform("e", 1)

    await uniBuffTest.update()

    // ------ QUAD ------ //


    const quadBuff = new VertexBuffer({bufferDataArray: QuadVerts, pads: [2]})

    const postQuad = new Thing(quadBuff,new Shader(
      Sketch.wgpu.getFullScreenQuadVert(),/*wgsl*/`

      @group(3) @binding(0)
      var<storage, read_write> histogram: array<float>;

      @group(3) @binding(1)
      var<storage, read_write> particle: array<float>;

      // @group(1) @binding(0)
      // var<uniform> unibuff: array<float,10>;

      // @group(2) @binding(0)
      // var tSampler: sampler;

      // @group(2) @binding(1)
      // var tex: texture_2d<f32>;

      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) uv: v2,
        // @location(0) inCol: v4
        ) -> @location(0) v4 {
        var uvn = uv*0.5 + 0.5;

        var res = u.resolution.xy;
        var arrIdx = uint(U.x) + uint(U.y)*uint(res.x);

        var histoTap = histogram[arrIdx];

        let h = histoTap;

        histoTap = 1.-exp(-abs(histoTap)*0.04);

        var col = v4(sin(vec3(3- h*0.002,2 ,1)+(1.-histoTap)*2.007 + -0.2 + sin(u.time)*0.2)*0.5 + 0.5,1.);
        col *= histoTap*1.;
        col[3] = 1.;
        col = 1.- col;
        
        //col[2] = U.x/res.x;
        // var col = v4(histogram[uint(abs(uv.x*20.))%100u]*1.,0.,0.,1.);
        // col.w = 1.;

        // col = fract(U.xyxy/100.);
        
        return col;
      }`
    ))

    // postQuad.setWritable(,0)
    postQuad.setWritables([histogramBuff, particleBuff])
    // postQuad.setUbos([uniBuffTest])

    // postQuad.setTextures([canvasFb.textures[0]])
    // postQuad.setTexture(canvasFb.textures[0],1)
    // postQuad.setWritable(canvasFb.textures[0],0)
    // postQuad.setTexture(tex,4)

    // ------ CUBE ------ //
    const cubeBuff = new VertexBuffer({bufferDataArray: CubeVerts, pads: [4,4,2]})

    const cubeShader = new Shader(Sketch.wgpu.getPassThroughVert(), /*wgsl*/ `
      @group(2) @binding(0)
      var tSampler: sampler;

      @group(2) @binding(1)
      var tex: texture_2d<f32>;

      @fragment
      fn main(
        @builtin(position) U: v4,
        @location(0) inCol: v4
        ) -> @location(0) v4 {
        var col = inCol;
        var uv = fract(U.xy/u.resolution);

        col = textureSample(tex, tSampler, uv);

        // col = v4(1.,1.,1.,1.);

        if(sin(u.time*20.) > 0.){
          // col.x = 1.;
        }
        
        return col;
        // return v4(0.,1.,0.,1.);
      }
    `)

    const cubeThing = new Thing(cubeBuff,cubeShader )
    cubeThing.setTexture(tex,1)

    // quadThing.setUbos([Sketch.sharedUBO, Sketch.sharedUBO])


    const computePass = new ComputeProgram({
      compString: /*wgsl*/`
      
        fn IH(_a: int) -> int{
            var a = _a;
            a=(a^61)^(a>>16u);
            a=a+(a<<3u);
            a=a^(a>>4u);
            a=a*0x27d4eb2d;
            a=a^(a>>15u);
            return a;
        }

        fn H(_a: int) -> float{
            var a = _a;
            a=(a^61)^(a>>16u);
            a=a+(a<<3u);
            a=a^(a>>4u);
            a=a*0x27d4eb2d;
            a=a^(a>>15u);
            return float(a)/float(0x7FFFFFFF);
        }

        fn rand2(a: int) -> v2{
            return vec2(H(a^0x348593),
            H(a^0x8593D5));
        }

        fn randn(randuniform: v2) -> v2{
            var r = randuniform;
            r.x = sqrt(-2.*log(1e-9+abs(r.x)));
            r.y = r.y*6.28318;
            r = r.x*vec2(cos(r.y),sin(r.y));
            return r;
        }
        fn randc(randuniform: v2) -> v2{
            var r=randuniform;
            r.x=sqrt(r.x);
            r.y=r.y*6.28318;
            r=r.x*vec2(cos(r.y),sin(r.y));
            return r;
        }

        fn S(x: v3) -> v3{
          return vec3(x/(1e-6+dot(x.xyz,x.xyz)));
        }
        
        fn hash31(p: float)->v3{
          var p3 = fract(v3(p,p,p) * v3(.1031, .1030, .0973));
          p3 += dot(p3, p3.yzx+33.33);
          return fract((p3.xxy+p3.yzz)*p3.zyx); 
        }


        fn projParticle(_p: v3) -> v3{
          var p = _p;

          // let m = rot(u.time);
          
          // let rr = p.xy * m;

          // p *= rotY3(u.time*0.3 + sin(u.time*0.3)*0.8);
          // p *= rotZ3( 0. + sin(u.time)*0.5 );

          // p.z += 15.;
          // p.x += 0.5;
          // p.y -= 2.5;
          // p *= 1.;
          //p.z += 1.;
          p *= 2.;


          var o = (cam.proj*cam.view*vec4(p.x,p.y,p.z,1.));
          o /= o.w;

          let z = o.z;

          p = o.xyz;

          // p.z = z;

          //q.z = p.z;

          //var q = vec4(cam.proj*cam.view*v4(p,1.));
          //q = q/q.w;
          return p;
        }

        @group(3) @binding(0)
        var<storage, read_write> histogram: array<float>;
        @group(3) @binding(1)
        var<storage, read_write> particle: array<float>;

        @compute
        @workgroup_size(256,1,1)

        fn main(
          @builtin(workgroup_id) wkId: uv3,
          @builtin(global_invocation_id) id: uv3,
        ){
          let fid = v3(id);
          let iid = iv2(id.xy);

          let particleIdx = iid.x + iid.x * iid.y;
          let floatId = float(iid.x + iid.x * iid.y);

          let iters = 140;
          var res = u.resolution.xy;
          //res[0] = u.resolution[0];
          //res[1] = u.resolution[1];

          var p = sin(v3(0.4,0.1 + floatId*sin(0.2*floatId),0.6)*floatId + u.time);
          p += 0.;
          p *= .4;

          p = hash31(float(particleIdx)*0.02);

          //var p = v3(0.,0.,0.);

          //p *= res.xyy;
          var env = u.time + sin(u.time);
          var envb = sin(u.time*0.45);

          // env *= 0.;
          // envb *= 0.;

          for(var i = 0; i < iters; i++){
            let seed = particleIdx*10000000 + i*100;

            let r = H(seed);


            if(r<.3){
              p = p + 4.3 + envb;
              p *= rotX3(env*0.2);
              p = p/clamp(dot(p,p),-0.2,4.);
            } else if(r<.66){
              // p.xz *= rot(5.2+ sin(particleIdx*0.00001)*0.001);
              // p.yz *= rot(5.2);
              p = p+vec3(-1.,0.4,0.);
              p = p/clamp(dot(-p,p),-3.2,1.);
              p = p*vec3(2.,1.5,1.2)*1.5;
            }
            else {
              p = p - v3(-0.2,0.2,0.2);
              p = p/clamp(dot(p,p),-4.5,10.);
              p = p*vec3(2.,1.5,1.2)*3.1;
            }

            var q = projParticle(p);
            // let uv = q.xy/2. + 0.5;
            let uv = q.xy/2. + 0.5;
            let cc = iv2(uv.xy*res.x);

            let arrIdx = cc.x + cc.y*int(res.x);

            if ( q.z < 1. && uv.x > 0. && uv.x < 1. && uv.y > 0. && uv.y < 1.){
            // if ( q.z < 1. && arrIdx > 0 && arrIdx < int(res.x*res.y)){
                histogram[arrIdx] += 1.;
              }
            }
          }

        
      `,
    })

    // computePass.setWritable(histogramBuff, 0)
    // computePass.setWritable(particleBuff, 1)
    computePass.setWritables([histogramBuff, particleBuff])
    

    // computePass.setBuffer(tex)

    // ------------- RENDER ------------- //
    this.render = async () =>{
      Sketch.wgpu.defaultFramebuffer.textures[0].texture = Sketch.wgpu.context.getCurrentTexture()
      Sketch.wgpu.defaultFramebuffer.renderPassDescriptor.colorAttachments[0].view = 
        Sketch.wgpu.defaultFramebuffer.textures[0].view = 
          Sketch.wgpu.context.getCurrentTexture().createView()

      // const defaultTex = this.context.getCurrentTexture()
      // const defaultTexView = defaultTex.createView()

      tex.clear(new Vector4([0,0,1,1]))

      histogramBuff.clear(true)

      computePass.runBuffer({endLastPass: true, buffer: particleBuff})

      await Sketch.wgpu.flushPasses()


      
      
      Sketch.wgpu.defaultFramebuffer.startPass()
      // cubeThing.render()

      postQuad.render()

      await Sketch.wgpu.flushPasses()
    }
  
    // ------------- UpdateShit ------------- //
    this.updateShit = async () => {
      
      // Sketch.camera.target.x = 0.004
      // Sketch.camera.target.y = 0.
      // Sketch.camera.target.z = 0

      // Sketch.camera.position.x = sin(Sketch.clock.time)*5
      // Sketch.camera.position.y = cos(Sketch.clock.time + sin(Sketch.clock.time))*1
      // Sketch.camera.position.z = cos(Sketch.clock.time)*5
    }
  }
  
  // 🏃 
  async animate() {
    Sketch.clock.tick()
    if(process.env.DEV)
      this.stats.update()

    Sketch.camera.update()
    await Sketch.io.update()
    this.updateSharedUniforms()
    
    this.updateShit!()
    
    for(let callback of this.callbacks){
      callback()
    }
    this.render!()


    requestAnimationFrame(() => this.animate())
  }

  // 💻 
  private setup = async ()=>{
      window.addEventListener("resize", () => this.onWindowResize(), false)

      if(process.env.DEV){
        // @ts-ignore
          this.stats = new Stats()
          this.stats.setMode(0)
          document.body.appendChild(this.stats.domElement)
          this.stats.domElement.style.position = "absolute"
          this.stats.domElement.style.left = "0"
          this.stats.domElement.style.top = "0"
      }



      this.updateSharedUniforms()
  }

  // ↗ 
  onWindowResize() {
    const prevWidth = Sketch.wgpu.width
    const prevHeight = Sketch.wgpu.height
    Sketch.wgpu.width = Sketch.wgpu.canvas.width = Sketch.wgpu.canvas.clientWidth * window.devicePixelRatio
    Sketch.wgpu.height = Sketch.wgpu.canvas.height = Sketch.wgpu.canvas.clientHeight  * window.devicePixelRatio

    
    for( let texture of Texture.textures){
      // @ts-ignore
      if(texture.height === prevHeight && texture.width === prevWidth || texture.defaultTex){
        texture.resize(this.width, this.height)
      }
      // console.log(Texture.textures)
    }

    // Sketch.wgpu.context.configure({
    //   device: Sketch.wgpu.device,
    //   size: [Sketch.wgpu.width, Sketch.wgpu.height],
    //   format: "bgra8unorm",
    //   usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC // ?
    // })
  }
}
(async()=>{
  const sketch = new Sketch()
  await sketch.init()
  sketch.animate()
})()

