(function(plugIn) {
  jsx3.lang.Class.defineClass("giants.builder.game.sokoban.Canvas", giants.builder.game.sokoban.AbstractBlock, null, function(MAIN, main){
      
      var Core = giants.builder.game.sokoban.Core;
      var Game = Core.game;
      var ColorBlock = giants.builder.game.sokoban.ColorBlock;
      var imageBasePath = plugIn.resolveURI("images/sokoban/");
      
      main.images = {};
      main.images.canvasBg = "10px 0 url(" + imageBasePath + "background.png) no-repeat #EEEEEE";
      
      //Button
      main.images.helpBtn = imageBasePath + "helpBtn.png";
      main.images.resetBtn = imageBasePath + "resetBtn.png";
      main.images.undoBtn = imageBasePath + "undoBtn.png";
      main.images.pauseBtn = imageBasePath + "pauseBtn.png";
      
      //Mask and Tip
      main.images.startScreen = imageBasePath + "start.png";
      main.images.nextScreen  = imageBasePath + "next.png";
      main.images.endScreen   = imageBasePath + "end.png";
      main.images.pauseScreen = imageBasePath + "pause.png";
      main.images.overScreen  = imageBasePath + "over.png";
      main.images.maskScreen  = imageBasePath + "mask1.png";

      main.images.helpBoxScreenBg = "-372px -120px url(" + imageBasePath + "helpbox.png) no-repeat transparent";
      main.images.helpBoxScreen = imageBasePath + "helpbox.png";
      

      main.gameLevel = 1;
      main.gameStep  = 0;
      main.gameTime  = 0;
      main.helpBoxDisplay = 'none';
      main.maskDisplay = 'block';
      main.tipDisplay = '';
      main.tipScreen = main.images.startScreen;
      
      main.initialize = function() {
        Core.initializeTaskMaps();
        this.mapBlock = this.getDescendantOfName("MapBlock");
        if(!this.mapBlock) {
            var block = new jsx3.gui.Block("MapBlock");
            this.setChild(block);
            this.mapBlock = block;
        }
        this.setting = {};
        this.setting.imageStyle = "classical";
        this.newGame = new Core.game();

        //restore last passed game
        if(jsx3.ide && jsx3.ide.getIDESettings()) {
          var settings = jsx3.ide.getIDESettings();
          var passed = settings.get("giants", "sokoban", "passed") || 0;
          //this.newGame.level = parseInt(passed,10) + 1;
          this.passedLevel = parseInt(passed,10);
        }

        this.newGame.setOnDrawGameHandler(jsx3.makeCallback(this.onDrawGame, this));
        this.newGame.setOnUpdateOneBlockHandler(jsx3.makeCallback(this.onUpdateOneBlock, this));
        
        this.newGame.onShowLevel = jsx3.makeCallback(this.showLevel, this);
        this.newGame.onShowStep  = jsx3.makeCallback(this.showStep, this);
        this.newGame.onStartGame  = jsx3.makeCallback(this.onStartGame, this);
        this.newGame.onLevelPassed = jsx3.makeCallback(this.onLevelPassed, this);
        this.newGame.onFinishGame = jsx3.makeCallback(this.onFinishGame, this);
      };

      main.onDestroy = function() {
        if(this.timer) {clearTimeout(this.timer);}
      };
      
      main.addColorBlock = function(x, y, type) {
        var tag = "GAMEBLOCK_" + x + "_" + y + "";
        var hOffset = this.setting.imageSize * x + this.setting.marginX;
        var vOffset = this.setting.imageSize * y + this.setting.marginY;
        var imgSrc  = this.setting.imagePath + type + ".gif";
        
        var img = new ColorBlock(tag, x, y);
        img.setName(tag);
        img.setSize(this.setting.imageSize).setImage(imgSrc);
        img.setLeft(hOffset).setTop(vOffset);
        this.mapBlock.setChild(img, jsx3.app.Model.PERSISTNONE);
        img.setProperty("jsxid", img.jsxid);
      };
      
      main.clearImages = function() {
        this.mapBlock.removeChildren();
      };
      
      main.calcSetting = function(width, height) {
        var imageSize = (height<=10 && width<=13) ? 30 : 20;
        this.setting.imagePath = imageBasePath + this.setting.imageStyle + "/" + imageSize + "/";
        this.setting.marginX = (Math.floor(440/imageSize) - width)*imageSize/2 + 35;
        this.setting.marginY = (Math.floor(360/imageSize) - height)*imageSize/2 + 70;
        this.setting.imageSize = imageSize;
      };

      /**
       * Draw game content at canvas
       */
      main.onDrawGame = function(map, width, height) {
        if(!map) {return;}
        this.clearImages();
        this.calcSetting(width, height);
        for(var y = 0; y < height; y++){
            for(var x = 0; x < width; x++){
                this.addColorBlock(x, y, map.mapData[y][x]);
            }
        }
        this.mapBlock.repaint();
      };
      
      main.onUpdateOneBlock = function(x, y, type) {
        var tag = "GAMEBLOCK_" + x + "_" + y + "";
        this.mapBlock.getDescendantOfName(tag).setImage(this.setting.imagePath + type + ".gif");
      };
      
      main.onStartGame = function() {
        this.setProperty("gameTime", 0);
        if(this.timer) {clearTimeout(this.timer);}
        var calcTime = function() {
            //jsx3.log(me.gameTime);
            if(!this.newGame.isFreezed()) {
                this.gameTime++;
                this.getRenderedBox("divTime").innerHTML = this.gameTime;
                //this.setProperty("gameTime", this.gameTime);
            }
            this.timer = setTimeout(jsx3.$F(calcTime).bind(this), 1000);
        };
        calcTime.call(this);
      };

      main.onAfterPaint = function() {
        if(!this._initPassedLevel) {
          this._initPassedLevel = true;
          this.updatePassedNumber(this.passedLevel);
        }
        this.jsxsuper();
      };
      
      main.onLevelPassed = function(level, all) {
        if(level > this.passedLevel) {this.updatePassedNumber(level);}
        if(this.timer) {clearTimeout(this.timer);}
        if(all) {
            this.setProperty("tipScreen", this.images.endScreen);
            this.setProperty("maskDisplay", "block");           
            this.setProperty("tipDisplay", "block");
        } else {
            this.setProperty("tipScreen", this.images.nextScreen);
            this.setProperty("maskDisplay", "block");           
            this.setProperty("tipDisplay", "block");
        }
        this.showStep(0);
        this.getRenderedBox("divTime").innerHTML = 0;
      };
      
      main.onFinishGame = function() {
        if(this.timer) {clearTimeout(this.timer);}
      };

      main.choosePostion = function(x, y) {
        this.newGame.gotoXY(x,y);
      };  
      
      main.moveUp    = function() { this.newGame.go('up'   );};
      main.moveDown  = function() { this.newGame.go('down' );};
      main.moveRight = function() { this.newGame.go('right');};
      main.moveLeft  = function() { this.newGame.go('left' );};
      
      main.tipAction = function() {
          
        this.setProperty("tipDisplay", "none");
        this.setProperty("maskDisplay", "none");

        var tipText = this.tipScreen || 'start';
        if(tipText.indexOf("start")>0){
            this.newGame.start();
        }else if(tipText.indexOf("pause")>0){
            this.newGame.pause();
        }else if(tipText.indexOf("over")>0){
            this.newGame.start(1);
        }else if(tipText.indexOf("next")>0){
            if(this.passedLevel>=this.gameLevel) {
              this.newGame.nextLevel();
            } else {
              this.getServer().alert("Warning", "You have not passed this level, try it again!");
            }
        }else if(tipText.indexOf("end")>0){
            this.newGame.start(1);
        }      

      };
      
      main.startAction = function() {
        this.setProperty("tipDisplay", "none");
        this.setProperty("maskDisplay", "none");
        this.newGame.start();
      };

      main.nextAction = function() {
        if(this.passedLevel>=this.gameLevel) {
          this.setProperty("tipDisplay", "none");
          this.setProperty("maskDisplay", "none");
          this.newGame.nextLevel();
        } else {
          this.getServer().alert("Warning", "You have not passed this level, try it again!");
        }
      };  

      main.pauseAction = function() {
        if(!this.newGame.started) { return; }
        var isPaused = this.newGame.pause();
        if(isPaused) {
          this.setProperty("tipScreen", this.images.pauseScreen);
          this.setProperty("tipDisplay", "block");  
          this.setProperty("maskDisplay", "block");
          this.setProperty("helpBoxDisplay", 'none');
        } else {
          this.setProperty("tipDisplay", "none");
          this.setProperty("maskDisplay", "none");
        }
      };
      
      main.helpAction = function() {
        this.setProperty("helpBoxDisplay", this.helpBoxDisplay == 'none' ? 'block' : 'none');
      };

      main.undoAction = function() {
        this.newGame.undo();
      };  

      main.resetAction = function() {
        if(this.newGame.isFreezed()) { return; }
        this.newGame.restart();
      };
      
      //Update numbers: level, step
      main.showLevel = function(level) {
        this.gameLevel = level;
        this.getRenderedBox("divLevel").innerHTML = this.gameLevel;
        //this.setProperty("gameLevel", level);
      };
      
      main.showStep = function(step) {
        this.gameStep = step;
        this.getRenderedBox("divStep").innerHTML = step;
        //this.setProperty("gameStep", step);
      };

      main.updatePassedNumber = function(passed, total) {
        this.passedLevel = passed;
        total = total || Core.getMapNumber();
        this.getRenderedBox("divPassed").innerHTML = "Passed:" + passed + "/" + total;

        if(jsx3.ide && jsx3.ide.getIDESettings()) {
          var settings = jsx3.ide.getIDESettings();
          var passed = settings.set("giants", "sokoban", "passed", this.passedLevel);
        }
      };
      
      // Mouse Event for buttons
      main.onMouseOver = function(objEvent, objGUI) {
        objGUI.style.left = parseInt(objGUI.style.left, 10) + 1;
        objGUI.style.top  = parseInt(objGUI.style.top, 10)  + 1;
      };
      
      main.onMouseOut = function(objEvent, objGUI) {  
        objGUI.style.left = parseInt(objGUI.style.left, 10) - 1;
        objGUI.style.top  = parseInt(objGUI.style.top, 10)  - 1;
      };
      
      main.clearPassedNumber = function () {
        if(this.timer) {clearTimeout(this.timer);}
        this.setProperty("tipScreen", this.images.startScreen);
        this.setProperty("maskDisplay", "block");           
        this.setProperty("tipDisplay", "block");
        this.passedLevel = 0;
        this.updatePassedNumber(0);
        this.showStep(0);
        this.getRenderedBox("divTime").innerHTML = 0;
      };

      main.jumpToLastestLevel = function() {
        if(this.timer) {clearTimeout(this.timer);}
        this.setProperty("tipDisplay", "none");
        this.setProperty("maskDisplay", "none");
        this.newGame.level = this.passedLevel;
        this.newGame.nextLevel();
        this.showStep(0);
        this.getRenderedBox("divTime").innerHTML = 0;
      };
      
      main.loadTemplate('Canvas');

  });

})(this);
