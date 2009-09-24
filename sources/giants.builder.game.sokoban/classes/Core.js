(function(plugIn) {

  jsx3.lang.Class.defineClass("giants.builder.game.sokoban.Core", null, null, function(MAIN, main){
      
      var _mapLibrary = null;
      var _mapNumber  = 0;
      var _mapFile = plugIn.resolveURI("classes/map.txt");

      MAIN.getPlugIn = function() { return plugIn; }
      
      /**
       * Load maps from disk and cache them in private variable
       */
      MAIN.initializeTaskMaps = function() {
          if(!_mapLibrary) {
              try {
                  var req = new jsx3.net.Request();
                  req.open("GET", _mapFile, false);
                  req.send();
                  _mapLibrary = req.getResponseText();
                  _mapLibrary = _mapLibrary.split("\n");
                  for(var i=0; i<_mapLibrary.length; i++) {
                      if(_mapLibrary[i].indexOf("MapNumber")>-1){
                          _mapNumber = parseInt(_mapLibrary[i].replace("MapNumber=",""));
                          break;
                      }
                  };              
                  if(req.getStatus() != 200) {
                      throw "Status is " + req.getStatus();
                  } else if (!_mapLibrary) {
                      throw "ResponseText is null";
                  }
              } catch(ex) {
                  this.getPlugIn().getLog().error("Error in LoadMapData: " + ex);
              }
          }
      };
      
      MAIN.getMapNumber = function() {
          return _mapNumber;
      };
      
      MAIN.getMaps = function() {
          return _mapLibrary;
      };
      
      /**
       * Load some level task map
       * @param {Integer} level the level of loading map
       */
      MAIN.loadMap = function(level) {
          
          if(!_mapLibrary) { 
              MAIN.initializeTaskMaps(); 
          }
          
          var map = [], i, y, width, height;
          for(i=0; i<_mapLibrary.length; i++) {
              if(_mapLibrary[i].indexOf("[Map" + level + "]") > -1) {
                  width  = parseInt(_mapLibrary[i+1].replace("MapWidth=",""));
                  height = parseInt(_mapLibrary[i+2].replace("MapHeight=", ""));
                  for(y=0; y< height; y++) {
                      map[y] = _mapLibrary[i+3+y].replace("MapLine"+(y+1)+"=", "").split("");
                  }
              }
          }
          
          return {width: width, height: height, mapData: map};
          
      };
      
      /**
       * Check connective of two blocks in map, if blocks is connective, return connection path
       * @param {Array} p1 coordinates of block one, type is array and [0] is x-coordinate and [1] is y-coordinate.
       * @param {Array} p2 coordinates of block two
       * @return if blocks is connective, return connection path
       */
      MAIN.checkConnective = function(gameMap, p1, p2) {
          if(gameMap==null) return [];
          var height = gameMap.height;
          var width  = gameMap.width;
          var tree = [];
          var level = 0;
          tree[level] = [p1];

          var panelsFlag = new Array();
          for(var x=0; x< width; x++){
              for(var y=0; y< height; y++){
                  panelsFlag[x + y * width] = null;
              }
          };
          
          var checkFind = function(array, p){
              //print("check Find Function:");
              for(var o=0; o<array.length; o++){
                  if(array[o][0] == p[0] && array[o][1] == p[1]) return true;
              }
              return false;
          };      

          var checkPoint = function(p, level, parent){
              if(p[0]>=width || p[1]>=height) return 0;
              if(p[0]<=-1 || p[1]<=-1) return 0;

              var type = gameMap.mapData[p[1]][p[0]];
              if((type==1||type==4)&& panelsFlag[p[0] + p[1]*width]==null){
                  tree[level][tree[level].length] = p;
                  panelsFlag[p[0] + p[1]*width] = parent;
                  return 1;
              }
              return 0;
          };
          
          while(!checkFind(tree[level], p2)&&tree[level].length>0){
              tree[level+1] = [];
              for(var o=0;o <tree[level].length; o++) {
                  var p = tree[level][o];
                  checkPoint([p[0]+1,p[1]], level+1, p);
                  checkPoint([p[0]-1,p[1]], level+1, p);
                  checkPoint([p[0],p[1]+1], level+1, p);
                  checkPoint([p[0],p[1]-1], level+1, p);
              }
              level ++;
          };

          if(tree[level].length==0){
              return [];
          } else {
              var path = new Array();
              var count = 0;
              path[count] = p2;
              while(panelsFlag[path[count][0] + path[count][1]*width]!=null){
                  path[count + 1] = panelsFlag[path[count][0] + path[count][1]*width];
                  count ++;
              }
              return path;
          }
      };

      MAIN.showGameDialog = function() {
          var dialog;
          try {
              dialog = plugIn.loadRsrcComponent(plugIn.getResource('sokobanDlg'), plugIn.getServer().getRootBlock());
          } catch(ex) {
              plugIn.getLog().error("Error in showGameDialog:" + ex);
          }       
          window.setTimeout(function() {
              dialog.focus();
          }, 0);        
      };
  });

  jsx3.lang.Class.defineClass("giants.builder.game.sokoban.Core.game", null, null, function(GAME, game){
      
      var Core = giants.builder.game.sokoban.Core;
      
      /* 
       * var game = new Game();
       * game.setOnDrawHandler(f);
       * game.setOnOneDrawHandler(f);
       * game.start();
       * game.goStep('up'); game.go('down')....
       * game.gotoXY(x,y);
       * game.undo();
       * if(game.isFinished()) .....
       * game.start(level)
       * ....
       * 
       * game.info();
       */
      
      game.init = function() {
          this.started = false;
          this.paused = false;
          this.level = 1;
      };

      //--------------------------------------------------------------------
      // Event 
      //--------------------------------------------------------------------
      game.setOnDrawGameHandler = function(handler) {
          this.onDrawGame = handler;
      };
      
      game.setOnUpdateOneBlockHandler = function(handler) {
          this.onUpdateOneBlock = handler;
      };
      
      game.redrawOneBlock = function(x, y) {
          if(this.onUpdateOneBlock) {
              this.onUpdateOneBlock(x, y, this.map.mapData[y][x]);
          };
          if( this.map.mapData[y][x]==5 || this.map.mapData[y][x]==6 ){
              this.humanPostion = [x, y];
          }
      };
      
      game.start = function() {
          this.started = true;
          this.paused = false;
          this.undoList = [];
          this.resetStep();
          this.setMapByLevel(this.level);
          
          //Find worker's position
          var x, y, width = this.map.width, height = this.map.height;
          for(y = 0; y < height; y++){
              for(x = 0; x < width; x++){
                  if( this.map.mapData[y][x]==5 || this.map.mapData[y][x]==6 ){
                      this.humanPostion = [x, y];
                  }
              }
          }       

          if(this.onDrawGame) this.onDrawGame(this.map, this.map.width, this.map.height);
          if(this.onShowLevel) this.onShowLevel(this.level);
          if(this.onStartGame) this.onStartGame();
      };
      
      game.restart = function() {
          this.start();
      };
      
      game.go = function(direction) {
          if(this.isFreezed()) return;
          
          var x = this.humanPostion[0];
          var y = this.humanPostion[1];
          
          var x1=x, x2=x, y1=y, y2=y;
          if (direction == 'right'){
              x1 = x + 1;
              x2 = x + 2;
          };
          if(direction == 'left') {
              x1 = x - 1;
              x2 = x - 2;
          };
          if(direction == 'up')   {
              y1 = y - 1;
              y2 = y - 2;         
          };
          if(direction == 'down') {
              y1 = y + 1;
              y2 = y + 2;
          };

          var gameMap = this.map.mapData;
          var type  = gameMap[y][x];
          var type1 = gameMap[y1][x1];
          if(type1==1||type1==4) {
              
              gameMap[y1][x1] = (type1 == 1) ? 5 : 6;
              gameMap[y ][x ] = (type  == 5) ? 1 : 4;
              
              var undo = new Array();
              undo[0] = {x:x , y:y , from:type , to: gameMap[y ][x ]};
              undo[1] = {x:x1, y:y1, from:type1, to: gameMap[y1][x1]};
              this.pushUndoList(undo);

              this.incStep();
              this.redrawOneBlock(x,y);
              this.redrawOneBlock(x1,y1);
          };
          if (type1==2||type1==5||type1==6) {
              //nothing;
          };
          if (type1==3||type1==7) {
              if(gameMap[y2]&&gameMap[y2][x2]){
                  var type2 = gameMap[y2][x2];
                  if(type2==1||type2==4) {
                      gameMap[y2][x2] = (type2 == 1) ? 3 : 7;
                      gameMap[y1][x1] = (type1 == 3) ? 5 : 6;
                      gameMap[y ][x ] = (type  == 5) ? 1 : 4;

                      undo = [];
                      undo[0] = {x:x , y:y , from:type , to:gameMap[y ][x ]};
                      undo[1] = {x:x1, y:y1, from:type1, to:gameMap[y1][x1]};
                      undo[2] = {x:x2, y:y2, from:type2, to:gameMap[y2][x2]};
                      this.pushUndoList(undo);

                      this.incStep();
                      this.redrawOneBlock(x1,y1);
                      this.redrawOneBlock(x2,y2);
                      this.redrawOneBlock(x,y);
                  }
              }
          };
          if(this.isFinished()){
              this.started = false;
              this.levelPassed();
          }       
      };
      
      game.undo = function() {
          if(this.isFreezed()) return;
          var gameMap = this.map.mapData;

          var undoStep = this.popUndoList();
          if(!undoStep) return;
          
          for(var i=0; i<undoStep.length; i++){
              var x = undoStep[i].x;
              var y = undoStep[i].y;
              gameMap[y][x] = undoStep[i].from;
              this.redrawOneBlock(x,y);
          }       
      };
      
      game.resetStep = function() {
          this.step = 0;
          if(this.onShowStep) this.onShowStep(this.step);
      };

      game.incStep = function() {
          this.step++;
          if(this.onShowStep) this.onShowStep(this.step);
      };
      
      game.pushUndoList = function(info) {
          this.undoList.push(info);
      };
      
      game.popUndoList = function(info) {
          return this.undoList.pop();
      };
      
      game.gotoXY = function(x, y) {
          var x0 = this.humanPostion[0];
          var y0 = this.humanPostion[1];
          var gameMap = this.map.mapData;
          
          if(Math.abs(x0-x) + Math.abs(y0-y) == 1){
              var direction = 
                  (x0==x) ? 
                      (y0>y ? "up"   : "down" ):
                      (x0>x ? "left" : "right");
              this.go(direction);
              return;
          } else {
              var type=gameMap[y][x];
              if(type==1 || type==4){
                  var path = Core.checkConnective(this.map, this.humanPostion, [x,y]);
                  if(path.length!=0){
                      var me = this, i = path.length;
                      var fn = function() {
                          i = i-1; 
                          if(i>=0) {
                              me.gotoXY(path[i][0], path[i][1]);
                              setTimeout(fn, 50);
                          };
                      }
                      fn();
                  }
              }
          }
      };
      
      game.nextLevel = function() {
          this.level++;
          if(this.level > Core.getMapNumber()) this.level = 1;
          this.start();
      };
      game.levelPassed = function() {
          var finishAll = this.level==Core.getMapNumber();
          if(this.onLevelPassed) {
              this.onLevelPassed(this.level, finishAll);
          }
          
          //this.level ++;
          //this.start();
          //....
      };
      
      game.setMapByLevel = function(level) {
          this.map = Core.loadMap(level);
      };
      
      game.isPaused = function() {
          return this.paused;
      };
      
      game.pause = function() {
          this.paused = !this.paused;
          return this.paused;
      };

      game.isFreezed = function() {
          return this.paused || !this.started;
      };
      
      game.isFinished = function() {
          var gameMap = this.map.mapData;
          var height = this.map.height;
          var width  = this.map.width;
          
          for(var y=0; y<height; y++){
              for(var x=0; x<width; x++){
                  var type = gameMap[y][x];
                  if(type==4||type==6) return false;
              }
          }
          return true;        
      };
      
      game.isOver = function() {
      };
          
  });

})(this);