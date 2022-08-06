import { Matrix4, Vector, Vector3 } from "@0b5vr/experimental";
import { mat4, vec3 } from "gl-matrix";
import { Sketch } from "index";
import { Vec as Vec2, Vec3, Vec4, sin, cos, Vec, pi, tau } from "utils/wmath"



abstract class AbstractCamera {
  position: Vector3 = new Vector3([0.01,0.,-10])
  fov: number = 100
  near: number = 0.001
  far: number = 1000
  projMatrix: Matrix4
  viewMatrix: Matrix4
  inverseViewMatrix: Matrix4

  // 🔧 
  constructor(){}
  // ♻ 
  public abstract update (): void
}

enum CameraType {
  Orthographic,
  Perspective,
}

export class Camera extends AbstractCamera{
  pilot: boolean = false
  sphericalCoords: Vec2 = new Vec2(0.01,0.01)
  forwardDir = new Vec3(0,0,0)
  target: Vector3 = new Vector3([0.01,0.001,0.001])
  cameraType: CameraType = CameraType.Perspective

  // 🔧 
  constructor(){
    super()
    this.update()
  }

  // ♻ 
  update (){
    
    if(this.pilot){

      const mouseSpeed = 0.125

      if(Sketch.io.mouse.down)
        this.sphericalCoords = this.sphericalCoords.add( 
          new Vec2(
            Sketch.io.deltaMouseNdc.v[0]*mouseSpeed*Sketch.clock.deltaTime, 
            Sketch.io.deltaMouseNdc.v[1]*mouseSpeed*Sketch.clock.deltaTime,
        ))

      // this.sphericalCoords = new Vec2(
      //     Sketch.io.mouse.x/Sketch.wgpu.width,
      //     Sketch.io.mouse.y/Sketch.wgpu.height,
      // )


      // this.forwardDir.v[0] = cos(this.sphericalCoords.x*tau) * sin(this.sphericalCoords.y*pi)
      // this.forwardDir.v[1] = sin(this.sphericalCoords.x*tau) * sin(this.sphericalCoords.y*pi)
      // this.forwardDir.v[2] = cos(this.sphericalCoords.y*pi)

      // this.forwardDir.v[0] = sin(Sketch.clock.time)*0.5
      // this.forwardDir.v[1] = cos(Sketch.clock.time)*0.5
      // this.forwardDir.v[2] = 1
      
      // this.forwardDir = this.forwardDir.normalize()

      this.forwardDir = new Vec3(0,0,1)

      const pitch = this.sphericalCoords.x
      const yaw = this.sphericalCoords.y
      
      this.forwardDir = this.forwardDir.rot(yaw * tau,'x')
      this.forwardDir = this.forwardDir.rot(-pitch * tau,'y')
      this.forwardDir = this.forwardDir.normalize()
      



	// float* dir = new float[] {0, 0, 1};
	// //dir = Math::normalize(dir);
	// // rotate
	// dir = Math::rotateVector(dir, 1, 2, -state.pitch * Math::TAU);
	// dir = Math::rotateVector(dir, 0, 2, state.yaw * Math::TAU);

	// float* right = Math::normalize(Math::cross(new float[3]{ 0,1,0 }, dir));
	// right = Math::multiply(right, keyInput[0]);

	// dir = Math::normalize(dir);
	// dir = Math::multiply(dir, keyInput[1]);
	// //float* up = Math::normalize(Math::cross(dir, right));
	// //up = Math::multiply(up, keyInput[0]);
	// right = Math::multiply(right, speed);
	// dir = Math::multiply(dir, speed);
	// float* newCamPos = Math::add(state.camPos, right);
	// newCamPos = Math::add(newCamPos, dir);




      const forwardDir = new Vec3(this.forwardDir.v[0], this.forwardDir.v[1], this.forwardDir.v[2])
      const rightDir = new Vec3(0,1,0).cross(this.forwardDir)
      const upDir = this.forwardDir.cross(rightDir)


      let walkSpeed = 10;
      
      let walkVector = new Vec3(0,0,0)


      if(Sketch.io.getKeyDown("KeyW")){
        walkVector = walkVector.add(forwardDir.mul(walkSpeed))
      }
      if(Sketch.io.getKeyDown("KeyS")){
        walkVector = walkVector.add(forwardDir.mul(-walkSpeed))
      }

      if(Sketch.io.getKeyDown("KeyQ")){
        walkVector = walkVector.add(upDir.mul(walkSpeed))
      }
      if(Sketch.io.getKeyDown("KeyE")){
        walkVector = walkVector.add(upDir.mul(-walkSpeed))
      }
      if(Sketch.io.getKeyDown("KeyA")){
        walkVector = walkVector.add(rightDir.mul(walkSpeed))
      }
      if(Sketch.io.getKeyDown("KeyD")){
        walkVector = walkVector.add(rightDir.mul(-walkSpeed))
      }

      walkVector = walkVector.mul(Sketch.clock.deltaTime)


      this.position = this.position.add( new Vector3([walkVector.x, walkVector.y, walkVector.z]))

      this.target.x = this.position.x + this.forwardDir.v[0]
      this.target.y = this.position.y + this.forwardDir.v[1]
      this.target.z = this.position.z + this.forwardDir.v[2]

    }

    if(this.cameraType === CameraType.Perspective){
      this.projMatrix = Matrix4.perspective(this.fov, this.near, this.far)
      this.viewMatrix = Matrix4.lookAt(this.position, this.target)
      this.inverseViewMatrix = this.viewMatrix.inverse.transpose

      // this.projMatrix = this.projMatrix

      const viewMatrix = mat4.create()
      mat4.lookAt(
        viewMatrix,
        vec3.fromValues(this.position.x,this.position.y,this.position.z),
        vec3.fromValues(this.target.x,this.target.y,this.target.z),
        vec3.fromValues(0,1,0),
      )

      viewMatrix.forEach((v,i)=>{
        this.viewMatrix.elements[i] = v
      })

    }

  }
}