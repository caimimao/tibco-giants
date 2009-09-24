(function(plugIn) {

  plugIn.VERSION = "0.1_preview";

  plugIn.PROJECT_INFO = ['<div style="text-align:right">', 
    '<a target="_blank" href="http://code.google.com/p/tibco-giants/">Website</a> hosted by Google Code<br/>', 
    'Developed by <a href="mailto:eric.tibco@gmail.com">Eric SHI</a><br/> <br/>Version: $version$</div>'].join("");

  plugIn.loadAboutDlg = function() {
    this.load().when(jsx3.$F(function() {
      var dialog = this.loadRsrcComponent(this.getResource('aboutDlg_xml'), this.getServer().getRootBlock());
      dialog.getDescendantOfName("blkInfo").setText(this.PROJECT_INFO.replace("$version$",plugIn.VERSION), true);
    }).bind(this));
  };

  var generateHTML = function(name, desc, url) {
    return [
        "<b>", name, "</b>",
        (url ? "<sup><span style='color:blue;text-decoration:underline;font-size:8px;padding-left:5px;'><a target='_blank' href='"+url+"'>HELP</a></span></sup>" : ""),
        "<br/>",
        desc
      ].join("");
  };

  plugIn.loadAddonsListDlg = function() {
    this.load().when(jsx3.$F(function() {
      var dialog = this.loadRsrcComponent(this.getResource('addonsDlg_xml'), this.getServer().getRootBlock());
      var template = dialog.getDescendantOfName("blkTemplate");
      this.getExtPoint("info").processExts(function(ext, xml) {
        var block = template.doClone(jsx3.app.Model.PERSISTNONE, 1);
        block.setName(xml.attr("id"));
        block.getDescendantOfName("blkInfo").setText(generateHTML(xml.attr("name"), xml.attr("description"), xml.attr("url")));
        block.getDescendantOfName("imgLogo").setSrc(ext.getPlugIn().resolveURI(xml.attr("logo")));
        block.setDisplay(jsx3.gui.Block.DISPLAYBLOCK);
      });
      template.getParent().repaint();
    }).bind(this));
  };

  plugIn.checkVersion = function() {

    if(this._newVchecking) { return; }
    var doc = new jsx3.xml.Document();
    doc.setAsync(true);
    doc.subscribe("*", this, function(objEvent) {
      this._newVchecking = false;

      if (objEvent.subject == jsx3.xml.Document.ON_RESPONSE && !objEvent.target.hasError()) {
        var newVersion = objEvent.target.getValue();

        if (newVersion) {
          var myVersion = this.VERSION;
          if (jsx3.util.compareVersions(newVersion, myVersion) > 0) {
            this.getServer().confirm(
              "New Version Available", "A new version (" + newVersion + ") of GIAnts is available.",
              function() { window.open("http://code.google.com/p/tibco-giants/downloads/list", "jsxgiants_newversion"); }, null,
              "Download", "Later", 1, null, null,{nonModal:1}
            );
          } else {
            this.getServer().alert("Up-To-Date", "Your version (" + myVersion + ") of GIAnts is up-to-date.",
                null, null, {nonModal:1});
          }
        }
      } else {
        this.getLog().debug("Version check error: " + objEvent.target.getError());

        this.getServer().alert("Version Check Failed", "The version check failed. Check your network connection and try again.",
            null, null, {nonModal:1});
      }
    });

    doc.load("http://tibco-giants.googlecode.com/svn/trunk/version/giants.xml?ts=" + new Date().getTime());
    this._newVchecking = true;

  };

})(this);