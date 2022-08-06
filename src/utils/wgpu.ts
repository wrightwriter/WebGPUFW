import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"

import { FrameBuffer } from "./wframebuffer"
import { Texture } from "./wtexture"
import { AbstractBindingContainer } from "./wabstractbindingcontainer"
export * from "./wframebuffer"
export * from "./wtexture"
export * from "./wthing"
export * from "./wvertexbuffer"
export * from "./wuniformbuffer"
export * from "./wstoragebuffer"
export * from "./wgeom"
export * from "./wcompute"


// interface WTex {
//   texture: GPUTexture,
//   textureView: GPUTextureView,
//   width: number,
//   height: number,
//   depth: number,
// }

interface EncoderPass {
  commandEncoder: GPUCommandEncoder,
  passEncoder?: GPURenderPassEncoder | GPUComputePassEncoder,
  framebuffer?: FrameBuffer
}


export class WrightGPU{
  readonly device!: GPUDevice
  readonly gpu!: GPU
  readonly adapter!: GPUAdapter
  readonly queue!: GPUQueue
  readonly canvas!: HTMLCanvasElement
  readonly context!: GPUCanvasContext

  width: number
  height: number

  defaultFramebuffer: FrameBuffer

  encoderPasses: EncoderPass[] = []
  public get currPass(){return this.encoderPasses[this.encoderPasses.length - 1]}
  
  // 🔧 
  constructor(canvas: HTMLCanvasElement){
    this.canvas = canvas
  }

  // ♻ 
  public async flushPasses(){
    if(Sketch.wgpu.encoderPasses.length > 0){
      let commandBuffers: GPUCommandBuffer[] = []
      for(let pass of Sketch.wgpu.encoderPasses){
        if(pass.passEncoder)
          pass.passEncoder.end()
        commandBuffers.push(pass.commandEncoder.finish())
      }
      this.encoderPasses = []
      Sketch.wgpu.queue.submit(commandBuffers)
    }
  }

  // 🔧 
  public async initializeGPU(args?:{
    canvasConfig: GPUCanvasConfiguration
  }){
    args = ifExistsAElseB(args, {})

    this.width = this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio
    this.height = this.canvas.height = this.canvas.clientHeight  * window.devicePixelRatio


    // @ts-ignore
    this.gpu = navigator.gpu
    // @ts-ignore
    this.adapter = await this.gpu.requestAdapter()
    // @ts-ignore
    this.device = await this.adapter.requestDevice()
    // @ts-ignore
    this.queue = this.device.queue
    // @ts-ignore
    this.context = this.canvas.getContext('webgpu')

    if(!this.adapter || !this.device ){
      window.alert("Error in adapter or device setup.")
      return
    }

    this.context.configure({
      device: this.device,
      // size: [this.width, this.height],
      format: "bgra8unorm",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC, // ?
      // @ts-ignore
      alphaMode: "opaque"
    })

    const defaultTex = this.context.getCurrentTexture()
    const defaultTexView = defaultTex.createView()

    this.defaultFramebuffer = Object.create(FrameBuffer.prototype)

    const depthTex = new Texture({depthTex: true, framebuffer: this.defaultFramebuffer})

    
    const wDefaultTex: Texture = Object.create(Texture.prototype)
    wDefaultTex.texture= defaultTex
    wDefaultTex.view= defaultTexView
    wDefaultTex.width= this.width
    wDefaultTex.height= this.height
    wDefaultTex.depth= 1
    // @ts-ignore
    wDefaultTex.defaultTex= true
    wDefaultTex.props = {
      depthTex: true,
      // @ts-ignore
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      format: 'bgra8unorm'
    }
    Texture.textures.push(wDefaultTex)

    // @ts-ignore
    this.defaultFramebuffer.textures = [ wDefaultTex ]
    // @ts-ignore
    this.defaultFramebuffer.depthTexture = depthTex

    wDefaultTex.attachedFramebuffers = [this.defaultFramebuffer]

    const defaultFbRPDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: defaultTexView,
          clearValue: {r: 0.5, g: 0.1, b: 0.1, a: 0.5 },
          loadOp: "clear",
          storeOp: "store",
          // loadOp: "clear",
        }
      ]
      ,
      depthStencilAttachment:{
        view: depthTex.view,

        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: 'store',
      }
    }
    // @ts-ignore
    this.defaultFramebuffer.renderPassDescriptor = defaultFbRPDescriptor
  }

  public getPassThroughVert(): string{
    return require("../shaders/passthroughVert.wgsl").default
  } 
  public getFullScreenQuadVert(): string{
    return require("../shaders/fullscreenQuad.wgsl").default
  } 
}

// 🔢 
export class ShaderCompute{
  public readonly compModule: GPUShaderModule
  constructor(compString: string){
    compString = ShaderImports + compString
    this.compModule = Sketch.wgpu.device.createShaderModule({code: compString})
  }
}



// 🎈 
export class Shader{
  public readonly vertModule: GPUShaderModule
  public readonly fragModule: GPUShaderModule
  constructor(vertString: string, fragString: string){
    vertString = ShaderImports + vertString
    fragString = ShaderImports + fragString
    this.vertModule = Sketch.wgpu.device.createShaderModule({code: vertString}),
    this.fragModule = Sketch.wgpu.device.createShaderModule({code: fragString})
  }
}

export const ShaderImports = /* wgsl */`
  type iv4 = vec4<i32>;
  type iv3 = vec3<i32>;
  type iv2 = vec2<i32>;

  type uv4 = vec4<u32>;
  type uv3 = vec3<u32>;
  type uv2 = vec2<u32>;

  type v4 = vec4<f32>;
  type v3 = vec3<f32>;
  type v2 = vec2<f32>;
  type m2 = mat2x2<f32>;
  type m3 = mat3x3<f32>;
  type m4 = mat4x4<f32>;
  type float = f32;

  type int = i32;
  type uint = u32;

  struct Camera {
    view: m4,
    proj: m4,
    invView: m4,
    pos: v3,
    near: float,
    far: float,
  }

  @group(0) @binding(1)
  var<uniform> cam: Camera;

  struct UBO {
    resolution: v2,
    time: float,
    deltaTime: float,
    frame: float,
    mouse: v4,
  }
  @group(0) @binding(0)
  var<uniform> u: UBO;

  fn rot(a: float)-> m2{
    return m2(
      cos(a), -sin(a),
      sin(a), cos(a)
    );
  }

  fn rotX3(a: float) -> m3{
    let r = rot(a);

    return m3(
      1.,0.,0.,
      0.,r[0][0],r[0][1],
      0.,r[1][0],r[1][1]
    );
  }

  fn rotY3(a: float) -> m3{
    let r = rot(a);

    return m3(
      r[0][0],0.,r[0][1],
      0.,1.,0.,
      r[1][0],0.,r[1][1]
    );
  }

  fn rotZ3(a: float) -> m3{
    let r = rot(a);

    return m3(
      r[0][0],r[0][1],0.,
      r[1][0],r[1][1],0.,
      0.,0.,1.
    );
  }


  

  // @group(3) @binding(9)
  // var<storage, write> tex: array<float>;
`



