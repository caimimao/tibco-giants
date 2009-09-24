(function() {
    var konami = {};
    konami.pattern = "383840403739373966656665",
    konami.input = "";
    window.document.onkeydown = function(e) {
      konami.input+= e ? e.keyCode : event.keyCode;
      if (konami.input == konami.pattern) {
        konami.load();
        clearTimeout(konami.clear);
        return;
      }
      if (konami.pattern.indexOf(konami.input)==-1) {
        konami.clear_input();
      }
      clearTimeout(konami.clear);
      konami.clear = setTimeout(konami.clear_input,2000);
    }

    konami.clear_input = function() {
      konami.input="";
      clearTimeout(konami.clear);
    }
    
    konami.load = function() {
      jsx3.amp.Engine.getEngine(jsx3.IDE).getPlugIn("giants.builder.game.sokoban").load().when(function() {
        giants.builder.game.sokoban.Core.showGameDialog();
      });
    }

})();