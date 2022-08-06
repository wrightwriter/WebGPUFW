
import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"
import { UniformBuffer } from "./wuniformbuffer"
import { VertexBuffer, VertexBufferInstance } from "./wvertexbuffer"
import { Texture } from "./wtexture"
import { Shader } from "./wgpu"
import { AbstractBindingContainer } from "./wabstractbindingcontainer"
import { StorageBuffer } from "./wstoragebuffer"
import { FrameBuffer } from "./wframebuffer"


export class Thing extends AbstractBindingContainer{
  private vertexBuffers: VertexBufferInstance[] = []
  protected override pipeline: GPURenderPipeline
  protected override pipelineDescriptor: GPURenderPipelineDescriptor
  private shader: Shader
  private depthStencilState: GPUDepthStencilState


  setPipelineProps(){
    this.propagate()
  }
  
  private propagate(){
    for(let vertexBuffer of this.vertexBuffers){
      vertexBuffer.propagatePipeline(this.pipelineDescriptor)
    }
  }
  protected override refreshPipeline(): void {
    super.refreshPipeline()
    this.propagate()
    this.pipelineNeedsRefresh = false
  }


  // 🔧
  constructor(
    vertexBuffer: VertexBuffer,
    shader: Shader
  ){
    super()

    this.shader = shader

    // this.bindGroupLayouts.push(Sketch.sharedUniforms.bindGroupLayout)

    const layout = Sketch.wgpu.device.createPipelineLayout({
      bindGroupLayouts: this.bindGroupLayouts
    })
    const vertState: GPUVertexState = {
      module: shader.vertModule,
      entryPoint: 'main',
      buffers: [{
        arrayStride: vertexBuffer.stride,
        attributes: vertexBuffer.attributeDescriptors
      }]
    }


// interface GPUBlendComponent {
//   operation?: GPUBlendOperation;
//   srcFactor?: GPUBlendFactor;
//   dstFactor?: GPUBlendFactor;
// }

// interface GPUBlendState {
//   color: GPUBlendComponent;
//   alpha: GPUBlendComponent;
// }
    // 🌀 Color/Blend State
    const colorState: GPUColorTargetState = {
        format: 'bgra8unorm',
        // blend: {
        //   color:{
        //     operation:"add",
        //     srcFactor:""
        //   },
        //   alpha:{},
        // }
    };
    const fragState: GPUFragmentState = {
      module: shader.fragModule,
      entryPoint: 'main',
      targets: [colorState]
    }

    const primitiveState: GPUPrimitiveState = {
      frontFace: 'cw',
      cullMode: 'front',
      topology: 'triangle-list',
      
    }
    this.depthStencilState = {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus" // to sync this with the depth format
      },

    this.pipelineDescriptor = {
      layout: layout,
      vertex: vertState,
      fragment: fragState,
      primitive: primitiveState,
      depthStencil: this.depthStencilState
    }

    // this.pipeline = Sketch.wgpu.device.createRenderPipeline(this.pipelineDescriptor)

    this.pipelineNeedsRefresh = true

    this.vertexBuffers.push(vertexBuffer.getInstance(this.pipelineDescriptor))
    this.pipeline = this.vertexBuffers[0].pipeline // ?
  }
  private lastFB: FrameBuffer = null

  // 🔥 
  render(){
    
    const currPass = Sketch.wgpu.currPass
    const fb = currPass.framebuffer

    // TODO: fb changed? Do fbs even need change tho. what about ping pong fb. bruh.
    let refresh = false
    if(this.lastFB !== fb){ 
      this.lastFB = fb
      const pipelineFormat: GPUTextureFormat= this.pipelineDescriptor.fragment.targets[0].format 
      const pipelineDepthStencil: GPUDepthStencilState = this.pipelineDescriptor.depthStencil
      const passFormat = fb.textures[0].props.format
      const fbDepthTex = fb.depthTexture
      
  
      if(pipelineFormat !== passFormat){
        this.pipelineDescriptor.fragment.targets[0].format = passFormat
        refresh = true
      }
      if(!fbDepthTex && pipelineDepthStencil){
        this.pipelineDescriptor.depthStencil = undefined
        refresh = true
      } else if(
        fbDepthTex && !pipelineDepthStencil || 
        (pipelineDepthStencil && fbDepthTex && pipelineDepthStencil.format !== fbDepthTex.props.format)
      ){
        this.depthStencilState.format = fbDepthTex.props.format
        this.pipelineDescriptor.depthStencil = this.depthStencilState
        refresh = true
      }

      if(refresh)
        this.refreshPipeline()
    } 
    if (this.pipelineNeedsRefresh || refresh){
      this.refreshPipeline()
    }
    

    // const passEncoder = Sketch.wgpu.encoderPasses[Sketch.wgpu.encoderPasses.length - 1].passEncoder
    const passEncoder = currPass.passEncoder as GPURenderPassEncoder

    let i = 0
    for(let bindGroup of this.bindGroups){
      passEncoder.setBindGroup(i, bindGroup)
      i++
    }
    for(let vb of this.vertexBuffers){
      vb.draw(passEncoder)
    }
  }
}