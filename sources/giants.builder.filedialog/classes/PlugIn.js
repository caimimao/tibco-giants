(function(plugIn){

  var maxSize = 10;

  plugIn.PC_FILEDIALOG = "giant.builder.filedialog.OPEN_FILE_DIALOG";
  plugIn.PC_LISTEXECUTE = "giant.builder.filedialog.LIST_EXECUTE";

  plugIn.injectAOP = function() {
    jsx3.lang.AOP.pc(plugIn.PC_FILEDIALOG, {classes: "jsx3.io.FileDialog", methods: "showFileDialog"});
    jsx3.lang.AOP.before(plugIn.PC_FILEDIALOG, function(intType, objParam) {
      plugIn.injectFilterBar(this);
    });

  };

  plugIn.injectFilterBar = function(dialog) {
    this._jsxdialog = dialog;
    this._jsxlastfilterenable = false;
    this._jsxlastfiltertext = "";    

    var layoutGrid = dialog.getDescendantOfName("layout_horiz");
    plugIn.loadRsrcComponent("reFilterBar_XML", layoutGrid, false);
    layoutGrid.insertBefore(layoutGrid.getChild(3), layoutGrid.getChild(2));
    layoutGrid.setRows("26,*,28,28", true);

    var saved = this.getHistory();
    if(saved.length > 0) {
      var menu = this._jsxdialog.getDescendantOfName('jsx_filter_history');
      var xml = menu.getXML();
      var i = 0;
      jsx3.$A(saved).each(function(e) {
        var record = xml.createNode(jsx3.xml.Entity.TYPEELEMENT, "record");
        record.setAttribute("jsxid", e);
        record.setAttribute("jsxtext", jsx3.util.strTruncate(e, 60, null, 2/3));
        xml.appendChild(record);
      });
    }

    var list = dialog.getDescendantOfName('file_list');
    list.__insertRecord = list.insertRecord;
    list.__plugIn = this;
    list.insertRecord = function(objRecord, strParentRecordId, bRedraw) {
      this._jsxenablefilter = this.__plugIn.isFilterEnable();
      if(this._jsxenablefilter && this.__plugIn.getFilterText() !== "") {
        try {
          if(objRecord.name.match(new RegExp(this.__plugIn.getFilterText(), "ig"))) {
            this.__insertRecord(objRecord, strParentRecordId, bRedraw);
          }
        } catch(e) {
          if(objRecord.name.indexOf(this.__plugIn.getFilterText())>-1) {
            this.__insertRecord(objRecord, strParentRecordId, bRedraw);
          }
        }
      } else {
        this.__insertRecord(objRecord, strParentRecordId, bRedraw);
      }
    }
  };

  plugIn.getFilterText = function() {
    return this._jsxdialog.getDescendantOfName("txtFilterText").getValue();
  };

  plugIn.isFilterEnable = function() {
    return this._jsxdialog.getDescendantOfName("btnEnableFilter").getState() ==
           jsx3.gui.ToolbarButton.STATEON;
  };

  plugIn.setFilterEnable = function(bEnable) {
    this._jsxdialog.getDescendantOfName("btnEnableFilter").setState(
            bEnable ? jsx3.gui.ToolbarButton.STATEON: jsx3.gui.ToolbarButton.STATEOFF);    
  };

  plugIn.updateFilter = function() {
    if(this._jsxlastfilterenable != this.isFilterEnable()) {
      if(this._jsxlastfilterenable && this._jsxlastfiltertext != "") {
        this._jsxdialog.doReload();
        this.updateHistory();
      }
      if(!this._jsxlastfilterenable && this.getFilterText() != "") {
        this._jsxdialog.doReload();  
        this.updateHistory();
      }
    } else {
      if(this._jsxlastfilterenable && this._jsxlastfiltertext != this.getFilterText()) {
        this._jsxdialog.doReload();
        this.updateHistory();
      }
    }
    this._jsxlastfilterenable = this.isFilterEnable();
    this._jsxlastfiltertext = this.getFilterText();
  };

  plugIn.doFilterHistory = function(strHistoryId) {
    var menu = this._jsxdialog.getDescendantOfName('jsx_filter_history');
    var record = menu.getRecord(strHistoryId);
    var filterInput = this._jsxdialog.getDescendantOfName("txtFilterText");
    filterInput.setValue(record.jsxid);
    if(this.isFilterEnable()) {
      this._jsxdialog.doReload();
      this.updateHistory();
    }
  };

  plugIn.getHistory = function() {
    var settings = jsx3.ide.getIDESettings();
    return settings.get("filedialog", "history") || [];
  };

  plugIn.setHistory = function(h) {
    var settings = jsx3.ide.getIDESettings();
    if (h)
      if (h.length > maxSize) h.splice(0, h.length - maxSize);
    settings.set("filedialog", "history", h);
  };

  plugIn.updateHistory = function() {

    var menu = this._jsxdialog.getDescendantOfName('jsx_filter_history');

    var xml = menu.getXML();
    var root = xml.getRootNode();
    var children = root.getChildNodes();
    var strFitlerText = this.getFilterText();

    if (strFitlerText != "") {

      if(menu.getRecord(strFitlerText)) {
        var record = menu.getRecordNode(strFitlerText);
      } else {
        var oldestFilter = null;
        if (children.size() >= maxSize) {
          oldestFilter = root.getLastChild();
          root.removeChild(oldestFilter);
        }
        var record = root.createNode(jsx3.xml.Entity.TYPEELEMENT, "record");
        record.setAttribute("jsxid", strFitlerText);
        record.setAttribute("jsxtext", jsx3.util.strTruncate(strFitlerText, 60, null, 2/3));
      }
      root.insertBefore(record, root.getFirstChild());
      menu.clearCachedContent();

      var saved = menu.getXML().getRootNode().getChildNodes().toArray().map(
              function(item){return item.getAttribute("jsxid")});
      this.setHistory(saved);

    }    
  };

  plugIn.injectAOP();

})(this);