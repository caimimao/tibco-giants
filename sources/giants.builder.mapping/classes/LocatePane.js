jsx3.lang.Class.defineClass("giants.builder.mapping.LocatePane",
        jsx3.gui.Block, null, function(KLASS, instance) {

  instance.testRecord = function(mapper, record) {
      var textbox = mapper.getDescendantOfName("jsx_schema_filter_textbox");
      var tree = mapper.getRulesTree();
      var re = new RegExp(textbox.getValue(), "ig");
      if(record.getAttribute("opname").match(re)) {
        this.lastMatchedId = record.getAttribute('jsxid');
        tree.getRendered().scrollTop=0;
        tree.setValue(this.lastMatchedId, true);
        textbox.setBackgroundColor("#FFFFFF", true);
        return true;
      }
      return false;    
  };

  instance.locateOperation = function(objButton) {
    var mapper = objButton.getAncestorOfType("jsx3.ide.mapper.Mapper");
    var textbox = mapper.getDescendantOfName("jsx_schema_filter_textbox");
    var tree = mapper.getRulesTree(),i;

    if(textbox.getValue()) {
      if((textbox.getValue() == this.lastSearchText) && this.lastMatchedId) {
        this.lastSearchText = textbox.getValue();

        var records = tree.getXML().selectNodes("//record[@type='P']");
        var find = false;
        for(i=0; i< records.size(); i++) {
          var record = records.get(i);
          if(!find) {
            if(record.getAttribute("jsxid") == this.lastMatchedId) {
              find = true;
            }
          } else {
            if(this.testRecord(mapper, record)) return true;
          }
        }
        for(i=0; i< records.size(); i++) {
          if(this.testRecord(mapper, records.get(i))) return true;
        }
      } else {
        this.lastSearchText = textbox.getValue();
        tree = mapper.getRulesTree();
        var records = tree.getXML().selectNodes("//record[@type='P']");
        for(i=0; i< records.size(); i++) {
          if(this.testRecord(mapper, records.get(i))) return true;
        }
      }
      textbox.setBackgroundColor("#FFD2D2", true);
      return false;
    }
    return false;
  };
  
});