import { Actions, GameObjects, Scene } from 'phaser';

type Keys = {
  up:Phaser.Input.Keyboard.Key;
  down:Phaser.Input.Keyboard.Key;
  left:Phaser.Input.Keyboard.Key;
  right:Phaser.Input.Keyboard.Key;
  z:Phaser.Input.Keyboard.Key;
  q:Phaser.Input.Keyboard.Key;
  s:Phaser.Input.Keyboard.Key;
  d:Phaser.Input.Keyboard.Key;
  dash:Phaser.Input.Keyboard.Key;
}

export class Game extends Scene {
  private player!:Phaser.GameObjects.Image;
  private keys!:Keys;
  private vx = 0;
  private vy = 0;
  private lastDir = new Phaser.Math.Vector2(1, 0);
  private readonly ACC = 900;
  private readonly MAX = 260;
  private readonly FRICTION = 8;
  private readonly DASH = 420;
  private readonly DASH_COOLDOWN = 300;
  private lastDashTime = -9999;

  constructor() {
    super('Game');
  }

  preload() {
    this.load.setPath('assets');
    this.load.image('crate', 'loot_crate.png');
    this.load.image('terrain', 'cobble.png');
  }

  create() {
    this.player = this.add.image(500, 500, 'crate');
    const kb = this.input.keyboard!;
    this.keys = {
      up:kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      down:kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      left:kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right:kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      z:kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      q:kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      s:kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d:kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      dash:kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
    }
  }

  update(time:number, delta:number) {
    const dt = delta/1000; // Pour avoir les secondes
    const xAxis = (this.keys.q.isDown || this.keys.left.isDown ? -1 : 0) + (this.keys.d.isDown || this.keys.right.isDown ? 1 : 0);
    const yAxis = (this.keys.z.isDown || this.keys.up.isDown ? -1 : 0) + (this.keys.s.isDown || this.keys.down.isDown ? 1 : 0);
    // ^ Get les 2 de manière indépendantes = Pouvoir avoir les diagonales.

    let dir = new Phaser.Math.Vector2(xAxis, yAxis);
    if(dir.lengthSq() > 1e-6){
      dir = dir.normalize(); // Normalisation si pas = 0.
      this.lastDir.copy(dir);
    }

    this.vx += dir.x * this.ACC * dt;
    this.vy += dir.y * this.ACC * dt; // application de l'acceleration : v = dir * ACC * dt

    const f = Math.max(0, 1-this.FRICTION * dt); // Calcul du DRAG via Euler simplifié. Litérallement.
    
    this.vx *= f;
    this.vy *= f; // Ajout du multiplicateur dégressif

    const speed = Math.hypot(this.vx, this.vy); // Racine carrée des 2 vx et vy => Clamp Vmax
    if(speed > this.MAX){
      const k = this.MAX / speed;
      this.vx *= k;
      this.vy *= k; //Plafonnage de l'accel
    }

    if(Phaser.Input.Keyboard.JustDown(this.keys.dash) && time - this.lastDashTime > this.DASH_COOLDOWN){
      const dashDir = dir.lengthSq() > 0 ? dir : this.lastDir; // Si (0,0) => On prend la derniere valeur.
      this.vx += dashDir.x * this.DASH;
      this.vy += dashDir.y * this.DASH;
      this.lastDashTime = time; //Temps actuel en ms à la frame.

      this.tweens.add({
        targets:this.player,
        scale: {from:0.9, to:1},
        duration: 100,
        ease:'Quad.easeOut',
      });
    }

    this.player.x += this.vx * dt;
    this.player.y += this.vy * dt; // Integration de la position

    const halfW = this.player.displayWidth * 0.5; //On fait comme le wrapInRectangle => On garde la moitié du sprite
    const halfH = this.player.displayHeight * 0.5;
    const maxX = this.scale.width - halfW; // Vu qu'on prend 0.5/0.5.
    const maxY = this.scale.height - halfH;

    this.player.x = Phaser.Math.Clamp(this.player.x, halfW, maxX);
    this.player.y = Phaser.Math.Clamp(this.player.y, halfH, maxY);
  }
}
