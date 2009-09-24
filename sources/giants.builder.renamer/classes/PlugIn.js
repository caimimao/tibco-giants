jsx3.lang.Class.defineClass("giants.builder.renamer.PlugIn", jsx3.amp.PlugIn, null, function(KLASS, instance) {

  var CACHED_DOC = "_giant_builder_renamer_hungarian_setting";

  instance.prefixHash = {};

  instance.loadSettingDlg = function() {
    var r1 = this.getResource("cdfHungarianSettings").load();
    var r2 = this.getResource("settingDlg_xml").load();
    r1.and(r2).when(jsx3.$F(this._loadSettingDlg).bind(this));
  };

  instance.loadDefaultHungarianSetting = function() {
    return this.getResource("cdfHungarianSettings").getData().toString();
  };

  instance.loadHungarianSetting = function() {
    if(jsx3.ide) {
      var prefixs = jsx3.ide.getIDESettings().get("hungarian");
      if(prefixs) {
        var cdf = jsx3.xml.CDF.Document.newDocument(), bNull=true;
        for(var item in prefixs) {
          cdf.insertRecord({jsxid: item, hungarian: prefixs[item]});
          bNull = false;
        }
        if(!bNull) {
          return cdf;
        } else {
          return this.getResource("cdfHungarianSettings").getData();
        }
      } else {
        return this.getResource("cdfHungarianSettings").getData();
      }
    } else {
      var cdf = this.getServer().getCache().getDocument(CACHED_DOC);
      if(!cdf) {
        this.getServer().getCache().setDocument(CACHED_DOC, this.getResource("cdfHungarianSettings").getData());
      }
      return this.getServer().getCache().getDocument(CACHED_DOC);
    }
  };

  instance.saveHungarianSetting = function(xml) {
    var hungarians = {};
    var records = xml.selectNodes("//record");
    for (var i = records.iterator(); i.hasNext(); ) {
      var record = i.next();
      var keycode = record.getAttribute("hungarian");
      var jsxid = record.getAttribute("jsxid");
      hungarians[jsxid] = keycode;
    }
    if(jsx3.ide) {
      var prefs = jsx3.ide.getIDESettings(true);
      prefs.set("hungarian", hungarians);
      prefs.save();
    } else {
      this.getServer().getCache().setDocument(CACHED_DOC, xml);
    }
    this.updateHashMap(this.loadHungarianSetting());
  };

  instance.updateHashMap = function(xml) {
    this.prefixHash = {};
    var records = xml.selectNodes("//record");
    for (var i = records.iterator(); i.hasNext(); ) {
      var record = i.next();
      var keycode = record.getAttribute("hungarian");
      var jsxid = record.getAttribute("jsxid");
      this.prefixHash[jsxid] = keycode;
    }
  };

  instance._loadSettingDlg = function() {
    var dialog = this.getServer().getJSXByName(this._settingdlg);
    if(!dialog) {
      dialog = this.loadRsrcComponent("settingDlg_xml", this.getServer().getRootBlock());
      if(dialog.initDialog) {
        dialog.initDialog();
      }
      this._settingdlog = dialog.getName();
      jsx3.sleep(function() { dialog.focus() });
    } else {
      dialog.focus();
    }
  };

  instance.loadRenamerDialog = function() {
    
    var r1 = this.getResource("cdfHungarianSettings").load();
    var r2 = this.getResource("renameDlg_xml").load();
    r1.and(r2).when(jsx3.$F(this._loadRenamerDialog).bind(this));
  };

  instance._loadRenamerDialog = function() {
    this.updateHashMap(this.loadHungarianSetting());
    var dialog = this.getServer().getJSXByName(this._compname);
    if(!dialog) {
      dialog = this.loadRsrcComponent(this.getResource('renameDlg_xml'), this.getServer().getRootBlock());
      if (dialog.initDialog) {
        dialog.initDialog();
      }
      this._compname = dialog.getName();
      jsx3.sleep(function(){
          dialog.focus(); 
      });
    } else {
      dialog.focus();
    }
      
  };

  instance.getHungarianByInstance = function(obj) {
    var testObj = obj.getClass();
    var name = testObj.getName();
    while(!this.prefixHash[name]) {
      alert(this.prefixHash[name] + "!" + name)
      testObj = testObj.getSuperClass();
      name = testObj.getName();
    }
    return this.prefixHash[name];
  };

  instance.batchRename = function(xml) {
    if(jsx3.ide) {
      var server = jsx3.ide.getActiveEditor().getServer();
      var records = xml.selectNodes("//record");
      for (var i = records.iterator(); i.hasNext(); ) {
        var record = i.next();
        var jsxid = record.getAttribute("jsxid");
        var obj = server.getJSXById(jsxid);
        obj.setName(record.getAttribute("jsxnewname"));
        jsx3.ide.getActiveEditor().setDirty(true);
        jsx3.ide.getPlugIn("jsx3.ide.editor.component").publish({subject:"domChanged", editor: jsx3.ide.getActiveEditor()});
      }
    }
  };

  instance.getSelectedComponents = function() {
    if(jsx3.ide) {
       var objs = jsx3.ide.getSelected();
       if(objs.length == 0) {
          objs = jsx3.ide.getActiveEditor().getServer().getBodyBlock().findDescendants(function(){return true}, true, true, false, false);
       }
       
       var cdf = jsx3.xml.CDF.Document.newDocument();
       jsx3.$A(objs).each(jsx3.$F(function(obj) {
         var hungarian = this.getHungarianByInstance(obj);
         cdf.insertRecord({jsxid:obj.getId(), jsxoldname:obj.getName(), jsxnewname: obj.getName(), jsxhungarian: hungarian, jsxclass:obj.getClass().getName()});
       }).bind(this));

    } else {
      //test code ....
      var cdf = jsx3.xml.CDF.Document.newDocument();
      cdf.insertRecord({jsxid:1, jsxoldname:"block", jsxnewname: "block", jsxhungarian: "blk", jsxclass: "jsx3.gui.Block"});
      cdf.insertRecord({jsxid:2, jsxoldname:"form", jsxnewname: "form", jsxhungarian: "frm", jsxclass: "tibco.uxcore.gui.Form"});
      cdf.insertRecord({jsxid:3, jsxoldname:"layout", jsxnewname: "layout", jsxhungarian: "lyt", jsxclass: "jsx3.gui.LayoutGrid"});
      cdf.insertRecord({jsxid:4, jsxoldname:"pane1", jsxnewname: "pane1", jsxhungarian: "blk", jsxclass: "jsx3.gui.Block"}); 
    }

    return cdf;

  };


});