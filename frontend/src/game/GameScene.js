import Phaser from 'phaser'

class GameScene extends Phaser.Scene{
  constructor(){
    super({key:'GameScene'})
  }
  preload(){
    this.load.image('tiles','/assets/tiles.png')
    this.load.image('player','/assets/player.png')
    this.load.image('car','/assets/car.png')
    this.load.image('neon','/assets/neon.png')
  }
  create(){
    // simple Mode7-like background using tileSprite
    const {width,height} = this.scale
    this.bg = this.add.tileSprite(width/2,height/2, width, height, 'tiles').setScale(1.2)
    this.player = this.add.sprite(120, height-80, 'player').setScale(2)
    this.player.setDepth(5)
    // player movement state
    this.player.speed = 160
    this.cursors = this.input.keyboard.createCursorKeys()
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    this.playerText = this.add.text(12, height-30, '', {fontSize:12, color:'#fff'})
    this.add.image(width-80,60,'neon').setScale(0.6).setAlpha(0.95)
    this.add.text(12,12,'Welcome to Civicverse — demo city',{fontSize:16, color:'#fff'})

    // spawn moving cars for life
    this.cars = this.add.group()
    for(let i=0;i<6;i++){
      const y = height - 40 - (i%3)*40
      const car = this.add.sprite(200 + i*100, y, 'car').setScale(1.2)
      car.speed = 0.3 + Math.random()*1.2
      this.cars.add(car)
    }
  }
  update(t,dt){
    // slowly scroll background to simulate pseudo-3D movement
    this.bg.tilePositionY += 0.4
    this.bg.tilePositionX += 0.2
    // player movement
    const speed = this.player.speed
    const prevX = this.player.x, prevY = this.player.y
    if(this.cursors.left.isDown) this.player.x -= speed * (dt/1000)
    if(this.cursors.right.isDown) this.player.x += speed * (dt/1000)
    if(this.cursors.up.isDown) this.player.y -= speed * (dt/1000)
    if(this.cursors.down.isDown) this.player.y += speed * (dt/1000)
    // clamp to bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, 16, this.scale.width-16)
    this.player.y = Phaser.Math.Clamp(this.player.y, 16, this.scale.height-16)
    // update HUD
    this.playerText.setText(`x:${Math.round(this.player.x)} y:${Math.round(this.player.y)} — Press E to interact`)

    // handle interaction (E)
    if(Phaser.Input.Keyboard.JustDown(this.keyE)){
      this.add.tween({targets:this.player, scale:1.9, yoyo:true, duration:120})
    }

    // move cars
    this.cars.getChildren().forEach(c=>{
      c.x += c.speed
      if(c.x>900) c.x = -100
    })
  }
}

export default GameScene
