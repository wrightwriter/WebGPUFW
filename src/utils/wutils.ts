


export class Clock{
  private _deltaTime: number = 0
  private _time: number = 0
  private _startTime: number = 0
  private _frame: number = 0

  public get time(){return this._time}
  public get deltaTime(){return this._deltaTime}
  public get frame(){return this._frame}

  constructor(){
    this._time = this._startTime = new Date().getTime()/1000
  }
  public tick(){
    const lastTime = this._time
    this._time = new Date().getTime()/1000. - this._startTime
    this._deltaTime = this._time - lastTime
    this._frame++
  }
}