jsx3.lang.Class.defineClass("giants.builder.monitor.MonitorPlugIn", jsx3.amp.PlugIn, null, function(KLASS, instance) {

  instance.onRegister = function() {
    this.getServer().getRootBlock().registerHotKey(jsx3.$F(function() {
      var plugin = this;
      plugin.load().when(function(){
        plugin.execute();
      });
    }).bind(this),"P",true,true,true);
  };

  instance.execute = function() {
    
    var dialog = this.getServer().getJSXByName(this._compname);
    if(!dialog) {
      dialog = this.loadRsrcComponent(this.getResource('monitorDlg_xml'), this.getServer().getRootBlock());
      if (dialog.initTool)
        dialog.initTool();
      this._compname = dialog.getName();
      jsx3.sleep(function(){
        if (dialog.getFirstResponder)
          dialog.getFirstResponder().focus();
        else
          dialog.focus(); 
      });
    } else {
      dialog.focus();
    }
      
  };
});