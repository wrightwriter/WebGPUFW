import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"
import { AbstractBindingContainer } from "./wabstractbindingcontainer"
import { Shader } from "./wgpu"
import { StorageBuffer } from "./wstoragebuffer"





// export class VertexBufferInstance extends AbstractBindingContainer{
//   vertexBuffer: VertexBuffer

//   // 🔧
//   constructor(
//     vertexBuffer: VertexBuffer,
//     shader: Shader
//   ){
//     super()

//     this.vertexBuffer = vertexBuffer

//     this.bindGroupLayouts[0] = Sketch.sharedBindGroup.bindGroupLayout
//     this.bindGroups[0] = Sketch.sharedBindGroup.bindGroup

//     const layout = Sketch.wgpu.device.createPipelineLayout({
//       bindGroupLayouts: this.bindGroupLayouts
//     })

//     const vertState: GPUVertexState = {
//       module: shader.vertModule,
//       entryPoint: 'main',
//       buffers: [{
//         arrayStride: vertexBuffer.stride,
//         attributes: vertexBuffer.attributeDescriptors
//       } ]
//     }
//     // 🌀 Color/Blend State
//     const colorState: GPUColorTargetState = {
//         format: 'bgra8unorm'
//     };
//     const fragState: GPUFragmentState = {
//       module: shader.fragModule,
//       entryPoint: 'main',
//       targets: [colorState]
//     }
//     // * TODO - Should be in VB?
//     const primitiveState: GPUPrimitiveState = {
//       frontFace: 'cw',
//       cullMode: 'front',
//       topology: 'triangle-list'
//     }
//     this.pipelineDescriptor = {
//       layout: layout,
//       vertex: vertState,
//       fragment: fragState,
//       primitive: primitiveState,
//       depthStencil: {
//         depthWriteEnabled: true,
//         depthCompare: "less",
//         format: "depth24plus" // to sync this with the depth format
//       }
//     }
//     this.pipeline = Sketch.wgpu.device.createRenderPipeline(this.pipelineDescriptor)
//   }
// }

export class VertexBufferInstance{
  protected vb: VertexBuffer

  public pipeline: GPURenderPipeline
  protected pipelineDescriptor: GPURenderPipelineDescriptor

  constructor(vb: VertexBuffer, pipelineDescriptor: GPURenderPipelineDescriptor){
    this.vb = vb
    // this.pipelineDescriptor = pipelineDescriptor
    // this.propagatePipeline(pipelineDescriptor)
  }

  propagatePipeline(pipelineDescriptor: GPURenderPipelineDescriptor){
    this.pipelineDescriptor = pipelineDescriptor
    // TODO: only propagate needed parts

    this.pipeline = Sketch.wgpu.device.createRenderPipeline(this.pipelineDescriptor)
  }
  draw(passEncoder: GPURenderPassEncoder){
    passEncoder.setPipeline(this.pipeline)
    passEncoder.setVertexBuffer(0, this.vb._buff)
    passEncoder.draw(this.vb.vertCnt, 1, 0, 0)
  }
}

export class VertexBuffer extends StorageBuffer{
  public attributeDescriptors: GPUVertexAttribute[] = []
  public vertBufferLayouts: GPUVertexBufferLayout[] = []
  public stride: number
  public pads: number[]
  public vertCnt: number
  public offsets: number[]
  
  getInstance(pipelineDescriptor: GPURenderPipelineDescriptor): VertexBufferInstance {
    return new VertexBufferInstance(this, pipelineDescriptor)
  }

  // 🔧
  constructor(
    { bufferDataArray, pads}: 
    {
      bufferDataArray: Float32Array | Int32Array; 
      pads: number[];
    }
  ){
    super()
    

    if(pads.length === 0){
      throw "Need attributes"
    }
    
    let offsets = []

    let stride = 0

    loop(pads.length, i =>{
      this.attributeDescriptors.push({
        shaderLocation: i,
        offset: 0,
        // @ts-ignore
        format: 'float32x' + pads[i]
      })
      // * TODO - there is one vert buffer layout
      // this.vertBufferLayouts.push({
      //   attributes: [this.attributeDescriptors[i]],
      //   arrayStride: 4 * pads[i],
      //   stepMode: "vertex"
      // })
      offsets.push(stride)
      stride += pads[i]
    })
    this.vertCnt = bufferDataArray.length / stride
    stride *= 4

  // public create(
  //   size: number = 1400, 
  //   usage: number = GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE, 
  //   mapped = false, 
  //   uniform = false
  // ): StorageBuffer{
    
    this.create(
      ((bufferDataArray.byteLength + 3) & ~3),
      GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
      bufferDataArray,
      true,
      false
    )

    // const buffer: GPUBuffer = Sketch.wgpu.device.createBuffer({
    //   mappedAtCreation: true,
    //   size: ((bufferDataArray.byteLength + 3) & ~3), // bruh, this rounds to ceil of repd of 4
    //   usage: GPUBufferUsage.VERTEX
    // })
    
    // const arrayBuffer: ArrayBuffer = buffer.getMappedRange()

    // new Float32Array(arrayBuffer).set(bufferDataArray)
    
    // buffer.unmap()    

    // this._buff = buffer

    this.stride = stride
    this.pads = pads 
    this.offsets = offsets
  }
}
