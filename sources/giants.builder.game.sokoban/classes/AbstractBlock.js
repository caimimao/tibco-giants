(function(plugIn) {
  
  jsx3.lang.Class.defineClass("giants.builder.game.sokoban.AbstractBlock", jsx3.gui.Template.Block, [],
    function(KLASS, instance) {
      KLASS.TEMPLATE_PATH = "jsxplugin://giants.builder.game.sokoban/classes/template/";

      instance.loadTemplate = function(templateName) {
          var server = plugIn.getServer();   
          var klass = this.getClass().getConstructor();
          var TEMPLATE_XML = server.loadInclude(KLASS.TEMPLATE_PATH + templateName + ".xml", templateName, "xml").toString();
          jsx3.gui.Template.compile(TEMPLATE_XML, this.getClass());
          this.getTemplateXML = function() {
              return TEMPLATE_XML;
          };
          return TEMPLATE_XML;
      };      
    });

})(this);
