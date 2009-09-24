(function(plugIn) {

  jsx3.lang.Class.defineClass(
      "giants.builder.game.sokoban.ColorBlock", 
      giants.builder.game.sokoban.AbstractBlock, [],     
      function(IMAGE, image) {
          
          image.jsxsize = 20;
          
          image.init = function(strName, x, y) {
              this.jsxsuper(strName);
              this.x = x;
              this.y = y;
          };
          
          image.onclick = function(objEvent, objGUI) {
              this.getParent().getParent().choosePostion(this.x, this.y);
              //jsx3.log(" User click ::" + this.x + "," + this.y);
              //this.doEvent(jsx3.gui.Interactive.JSXCLICK, {objEvent: objEvent});
          };
          
          image.setSize = function(size) {
              this.setProperty("jsxsize", size);
              return this;
          };

          image.setImage = function(image) {
              this.setProperty("jsximage", image);
              return this;
          };

          image.loadTemplate('ColorBlock');
          
  });

})(this);
