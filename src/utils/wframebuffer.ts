import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"
import { Texture } from "./wtexture"
import { Vec3 } from "./wmath"

export class FrameBuffer{
  readonly textures: Texture[] = []
  readonly depthTexture?: Texture
  readonly renderPassDescriptor: GPURenderPassDescriptor

  private commandEncoder: GPUCommandEncoder
  private passEncoder: GPURenderPassEncoder

  // 🔧
  constructor({
    resolution,
    depth,
    attachmentsCnt,
    format
  }: {resolution?: Vec3, depth?: boolean, attachmentsCnt?: number, format?: GPUTextureFormat}
  ){
    attachmentsCnt = ifExistsAElseB(attachmentsCnt, 1)
    resolution = ifExistsAElseB(attachmentsCnt, new Vec3(Sketch.wgpu.width, Sketch.wgpu.height, 1))

    let colorAttachments: GPURenderPassColorAttachment[] = []

    loop(attachmentsCnt, i => {
      const tex = new Texture({width: resolution.x, height: resolution.y, framebuffer: this, format})
      this.textures.push(tex)
      colorAttachments.push({
        view: tex.view,
        clearValue: {r: 0, g: 0, b: 0, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      })
    })

    this.renderPassDescriptor = {
      colorAttachments: colorAttachments
    }
    if(depth){
      this.depthTexture = new Texture({width: resolution.x, height: resolution.y, depth: resolution.z, depthTex: true, framebuffer: this})
      this.renderPassDescriptor.depthStencilAttachment = {
        view: this.depthTexture.view,
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: 'store',

        stencilClearValue: 0,
        stencilLoadOp: "clear",
        stencilStoreOp: 'store',
      }
    }

  }

  // ♻ 
  refresh(){
    // @ts-ignore
    let i = 0
    const rpDescriptor = this.renderPassDescriptor
    for( let colorAttachment of rpDescriptor.colorAttachments){
      const tex = this.textures[i]
      colorAttachment.view = tex.view
      i++
    }
    if(this.depthTexture)
      rpDescriptor.depthStencilAttachment.view = this.depthTexture.view
  }


  startPass(endLastPass: boolean = true){
    if(endLastPass){
      Sketch.wgpu.flushPasses()
    }

    this.commandEncoder = Sketch.wgpu.device.createCommandEncoder()
    this.passEncoder = this.commandEncoder.beginRenderPass(this.renderPassDescriptor)
    Sketch.wgpu.encoderPasses.push({
      commandEncoder: this.commandEncoder,
      passEncoder: this.passEncoder,
      framebuffer: this
    })
  }
}