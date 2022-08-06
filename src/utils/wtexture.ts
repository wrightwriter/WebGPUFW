import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"
import { FrameBuffer } from "./wframebuffer"
import { Vector3, Vector4 } from "@0b5vr/experimental"

export class Texture {
  static textures: Texture[] = []

  public attachedFramebuffers: FrameBuffer[] = []
  public texture: GPUTexture
  public view: GPUTextureView
  public width: number
  public height: number
  public depth: number

  public props:{
    depthTex: boolean,
    usage: GPUTextureUsage,
    format: GPUTextureFormat
  }

  private create(){
    const props = this.props
    const textureDesc: GPUTextureDescriptor = {
      // @ts-ignore
      // size: [args.width, args.height, args.depth],
      size: [this.width, this.height],
      // @ts-ignore
      // dimension: args.depth > 1 ? "3d" : "2d",
      // format: args.depthTex ? "depth24plus-stencil8" : "rgba32float",
      // format: props.depthTex ? "depth24plus" : "rgba32float",
      format: props.format,
      // @ts-ignore
      usage: props.usage
    }
    // console.log(textureDesc)

    const tex = Sketch.wgpu.device.createTexture(textureDesc)
    const texView = tex.createView()

    this.texture = tex
    this.view = texView
  }
  static fromArray({data}:{data: Vector4[][]}): Texture{
    let canvas = document.createElement("canvas")
    canvas.width = data.length
    canvas.height = data[0].length
    document.body.appendChild(canvas)

    canvas.style.opacity = "0"

    const imageData = canvas.getContext("2d").createImageData(canvas.width, canvas.height)


    loop(imageData.height, y=>{
      loop(imageData.width, x=>{
        const index = (x + y * imageData.width);
        const inputPix = data[y][x]
        imageData.data[index * 4 + 0] = inputPix.x * 255
        imageData.data[index * 4 + 1] = inputPix.y * 255
        imageData.data[index * 4 + 2] = inputPix.z * 255
        imageData.data[index * 4 + 3] = inputPix.w * 255
      })
    })

    canvas.getContext("2d").putImageData(imageData,0,0)

    const tex = new Texture({
      width: canvas.width,
      height: canvas.height,
      format: "rgba8unorm"
    })

    Sketch.wgpu.device.queue.copyExternalImageToTexture(
      {source:canvas},
      {texture: tex.texture} ,
      [canvas.width, canvas.height]
    )

    document.body.removeChild(canvas)
    canvas = null

    return tex
  }
  // 🔧
  constructor(
      args:{
        width?: number,
        height?: number,
        depth?: number,
        depthTex?: boolean,
        usage?: GPUTextureUsage,
        framebuffer?: FrameBuffer,
        format?: GPUTextureFormat
      }
  ){
    (async ()=>{
      args.width = ifExistsAElseB(args.width, Sketch.wgpu.width)
      args.height = ifExistsAElseB(args.height, Sketch.wgpu.height)
      args.depth= ifExistsAElseB(args.depth, 1)
      args.usage = ifExistsAElseB(
        args.usage, 
        args.depthTex ? 
          // GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC :
          GPUTextureUsage.RENDER_ATTACHMENT :
          GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST  // ?
          // GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST  // ?
          )
      args.format = ifExistsAElseB(
        args.format, 
        args.depthTex ? 
          "depth24plus" : "rgba32float",
          )

      if(args.framebuffer)
        this.attachedFramebuffers.push(args.framebuffer)
          
      this.width = args.width
      this.height = args.height
      this.depth = args.depth
      // @ts-ignore
      this.props = args

      this.create()

      Texture.textures.push(this)

      return Promise.resolve()
    })()
  }
  // 🔳 
  clear(colour: Vector4 = new Vector4([0,0,0,0])){
    const passDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [{
          view: this.view,
          clearValue: {r: colour.x, g: colour.y, b: colour.z, a: colour.w},
          loadOp: "clear",
          storeOp: "store",
      }]
    }

    const commandEncoder = Sketch.wgpu.device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(passDescriptor)

    Sketch.wgpu.encoderPasses.push({
      commandEncoder,
      passEncoder,
    })
  }

  // ↖ 
  resize(width: number, height: number, depth?: number){
    this.width = width
    this.height = height
    this.depth = ifExistsAElseB(depth, this.depth)

    // @ts-ignore
    if(this.defaultTex){
      const defaultTex = Sketch.wgpu.context.getCurrentTexture()
      const defaultTexView = defaultTex.createView()
      this.texture = defaultTex
      this.view = defaultTexView
    } else {
      this.texture.destroy()
      this.create()
    }
    for(let framebuffer of this.attachedFramebuffers){
      framebuffer.refresh()
    }
  }
}