console.clear();
var RED = "rgba(255,0,0,0.7)";
var CITY_COLOR = "rgba(255,255,255,0.25)";
var CITY2_COLOR = 0x113300;
var BASE_COLOR = 0x113333;
var SHIP_COLOR = 0x0000FF;
var AA_RANGE_COLOR = 0xff0000;

var graphics;
var bounds;
class Settings {
  constructor() {
    this.name = name;
    this.CITY_NUMBER = 2;
    this.BASE_NUMBER = 2;
    this.SCREEN_PADDING = 25;
    this.WORK_FACTOR = 0.0001;
    this.SHOW_AA = true;
    this.SHOW_FOG = false;
    this.DEBUG_CITIES = false;
    this.DEBUG_SQUADRON = false;
    this.DEBUG_BASES = true;
  }
}

class GameController {
  constructor() {
    this.cities = [];
    this.bases = [];
    this.squadrons = [];
  }
}

class City extends Phaser.Sprite {
  constructor(bounds, name) {
    super(window.game);
    this.name = name;
    this.people = getRandomArbitrary(200, 800);
    this.factories = getRandomArbitrary(200, 800);
    this.resources = 100;
    this.x = getRandomArbitrary(0, bounds.width - settings.SCREEN_PADDING) + settings.SCREEN_PADDING;
    this.y = getRandomArbitrary(0, bounds.height - settings.SCREEN_PADDING) + settings.SCREEN_PADDING;
    this.polyVertex = 5;
    this.draw();
  }
  get CityName() {
    return this.name;
  }
  get size() {
    return this.people / 40;
  }
  obtainResources() {
    this.resources += this.people * settings.WORK_FACTOR;
  }
  draw() {
    graphics = game.add.graphics(0, 0);
    if( settings.SHOW_AA ) {
      graphics.beginFill(AA_RANGE_COLOR, 0.15);
      graphics.drawCircle(this.x, this.y, this.size * 4);
    }
    if (this.poly === undefined) {
      this.poly = generatePolygon( this.x, this.y, this.polyVertex, this.size );
    } 
    graphics.beginFill(CITY2_COLOR);
    graphics.drawPolygon(this.poly.points);

    Phaser.Sprite.call(this, game, this.x, this.y, 'star');
    this.loadTexture( graphics.generateTexture() );
    this.anchor.setTo(0.5, 0.5);
    this.inputEnabled = true;
    this.input.enableDrag();
    game.add.existing(this);
    graphics.clear();   
  }

}

class Base extends Phaser.Sprite {
  constructor(bounds, name) {
    super(window.game);
    this.name = name;
    this.x = getRandomArbitrary(0, bounds.width);
    this.y = getRandomArbitrary(0, bounds.height);
    this.polyVertex = 8;
    this.size = 12;
    this.fighters = 0;
    this.bombers = 0;
    this.recon = 0;
    this.selected = false;
    this.draw();
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.immovable = true;
  }

  draw() {
   graphics = game.add.graphics(0, 0);
    if( settings.SHOW_AA ) {
      graphics.beginFill(AA_RANGE_COLOR, 0.15);
      graphics.drawCircle(this.x, this.y, this.size * 4);
    }
    if (this.poly === undefined) {
      this.poly = generatePolygon( this.x, this.y, this.polyVertex, this.size );
    } 
    graphics.beginFill(BASE_COLOR);
    graphics.drawPolygon(this.poly.points);

    Phaser.Sprite.call(this, game, this.x, this.y, 'star');
    this.loadTexture( graphics.generateTexture() );
    this.anchor.setTo(0.5, 0.5);
    this.inputEnabled = true;
    this.input.enableDrag();
    this.events.onInputDown.add(this.selectFunction, {param1: window.game.bases});
    game.add.existing(this);    
    graphics.clear();   
  }
  
  selectFunction(target) {

    gameController.bases.forEach(function(base) {  
      if(base.name == target.name){
        base.selected = true;
        base.tint = 0xFF00FF;
      } else {
        base.selected = false;
        base.tint = 0xFFFFFF;
      }
    });
  }
}                                    


class Squadron extends Phaser.Sprite {
  constructor( game, base, type, aircraftNumber ){
    super(window.game);
    this.x = base.x;
    this.y = base.y;
    this.base = base;
    this.type = type;
    this.number = aircraftNumber || 1;
    this.name = "sq_" + this.type + this.number;
    this.polyVertex = 3;
    this.size = 10;
    this.speed = 10;
    this.draw();
    this.inputEnabled = true;
    this.input.useHandCursor = true;
    this.input.enableDrag();    
    this.events.onInputDown.add(eventFunction);
    
    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.immovable = false;
    //this.body.collideWorldBounds = true;
    this.outOfBoundsKill = true;
    this.angle = 30;
  }
  
  draw(){
    if (this.poly === undefined) {
      this.poly = generatePolygon( this.x, this.y, this.polyVertex, this.size );
    }    
    graphics = game.add.graphics(0, 0);
    graphics.beginFill(SHIP_COLOR);
    graphics.drawPolygon(this.poly.points);
    graphics.endFill();
    Phaser.Sprite.call(this, game, this.x, this.y, 'star');
    this.loadTexture( graphics.generateTexture() );
    this.anchor.setTo(0.5, 0.5);
    this.moveUp();  
    game.add.existing(this);
    graphics.clear();
  }
}

function eventFunction(target) {
  console.log("Object click " + target.key);
}


var settings = new Settings();
var gameController = new GameController();


window.game = new Phaser.Game({
  height: "100%",
  renderer: Phaser.CANVAS,
  width: "100%",
  state: {
    init: function() {
      var debug;
      debug = this.game.debug;
      debug.font = "14px monospace";
      debug.lineHeight = 16;
      this.game.clearBeforeRender = false;
      this.game.forceSingleUpdate = false;
      graphics = game.add.graphics(0, 0);
      graphics.inputEnabled = true;
      graphics.input.useHandCursor = true;
    },

    preload: function() {
      this.load.baseURL = "//examples.phaser.io/assets/";
      this.load.crossOrigin = "anonymous";
      this.load.image('star', 'demoscene/star.png');
    },

    create: function() {
      bounds = this.world.bounds;
      
      var city;
      for (var i = 0; i < settings.CITY_NUMBER; i++) {
        city = new City(bounds, "city_" + i);        
        gameController.cities.push(city);
      }
      var base;
      for (var i = 0; i < settings.BASE_NUMBER; i++) {
        base = new Base(bounds, "base_" + i);
        gameController.bases.push(base);
      }      
      
      this.timer = game.time.events.loop(Phaser.Timer.SECOND *7 , this.createSquadron, this);
      this.createUnitTimer = game.time.events.loop(Phaser.Timer.SECOND *3 , this.createUnit, this);
      this.createGui();
    },
    
    createUnit: function() {
      let unitType = getRandomArbitrary(0,2);
      let baseId = getRandomArbitrary(0, gameController.bases.length-1);
      if(unitType == 0) gameController.bases[baseId].fighters += 1;
      if(unitType == 1) gameController.bases[baseId].bombers += 1;
      if(unitType == 2) gameController.bases[baseId].recon += 1;
    },
    
    createSquadron: function() {      
      let squadron = new Squadron(
        window.game, 
        gameController.bases[0],
        "Fighter");
      squadron.dest = gameController.bases[1];
      
      window.game.physics.arcade.moveToObject(squadron, squadron.dest, squadron.speed);
      
      gameController.squadrons.push(squadron);
    },
    
    update: function() {
      //rectA.x = game.input.activePointer.x;
      gameController.cities.forEach(function(city) {
        city.obtainResources();
        //city.x += 0.1;
      });
      gameController.squadrons.forEach(function(squadron) {
        if( window.game.physics.arcade.overlap(squadron, squadron.dest) ){ // alcanza el destino
          squadron.dest = squadron.base;
          squadron.returning = true;
          game.physics.arcade.moveToObject(squadron, squadron.base, squadron.speed);
        }
        // TODO Revisar:
        if( squadron.returning && window.game.physics.arcade.overlap(squadron, squadron.dest) ){ // Regresa a la base
          console.log("Regresado");
          squadron.dest = undefined;
          squadron.returning = false;
          squadron.visible = false;
          squadron.kill();
          delete squadron;
        }
      });
    },

    render: function() {
      var debug = this.game.debug;
      var debugX = 20;
      if( settings.DEBUG_BASES ) {
        gameController.bases.forEach(function(base) {
          debug.object(base, base.x +20 , base.y +20, {
            color: "auto",            
            keys: ["name", "selected", "fighters", "bombers", "recon"]
          });
        });
      }
      if( settings.DEBUG_CITIES ) {
        gameController.cities.forEach(function(city) {
          debug.object(city, debugX, 20, {
            color: "auto",
            label: "cities",
            keys: ["name", "people", "resources", "x", "y", "size"]
          });
          debugX += 200;
        });
      }
      debug.object(gameController.squadrons, debugX, 20, {
        color: "auto",
        label: "squadrons",
        keys: ["length"]
      }); 
  
      if( settings.DEBUG_SQUADRON ) {
        gameController.squadrons.forEach(function(squadron) {
          debug.object(squadron, squadron.x, squadron.y, {
            color: "auto",
            //label: "Squadron",
            keys: ["name"]
          });
        });
      }
    },

    shutdown: function() {
      this.gui.destroy();
    },

    createGui: function() {
      var gui = (this.gui = new dat.GUI());

      let settingsGUI  = gui.addFolder("Settings");
      settingsGUI.add(settings, "SHOW_AA", true);
      settingsGUI.add(settings, "DEBUG_CITIES", true);
      settingsGUI.add(settings, "DEBUG_SQUADRON", true);
      settingsGUI.add(settings, "DEBUG_BASES");
      //settingsGUI.add(settings, "WORK_FACTOR", 0, 10, 1);      
    }
  }
});

function getRandomArbitrary(min, max) {
  //return Math.random() * (max - min) + min;
  return window.game.rnd.integerInRange(min, max);
}

function generatePolygon(x, y, vertices, radius) {
  let poly = new Phaser.Polygon();
  let polyPoints = [];
  let prot;
  let angle = 360 / vertices;
  for (let i = 0; i <= vertices; i++) {
    prot = new Phaser.Point(x, y);
    //console.log(i + " angle: " + ( angle*i) );
    prot = prot.rotate(x, y, angle * i, true, radius);
    polyPoints.push(prot);
  }
  poly.setTo(polyPoints);
  return poly;
}