(function() {
    window.PanelManager = new (function PanelManagerAbstract(){
        var self = this;
      
        this.init = function(options) {
            self.options = options;
            
            jQuery.ajax({
                url: options.url,
                dataType:'json',
                cache: false, // Chrome && Internet Explorer has aggressive caching policies.
                success: function(json) {
                    self.panels = json.panels;
                    self.loadTemplates(0);
            }});
        }
        
        this.loadTemplates = function(idx) {
            if (idx == self.panels.length) {
                // done. load content.
                self.loadContent();
            } else if (MediaThread.templates[self.panels[idx].template]) {
                // it's already cached
                self.loadTemplates(++idx);
            } else {
                // pull it off the wire
                jQuery.ajax({
                    url:'/site_media/templates/' + self.panels[idx].template + '.mustache?nocache=v3',
                    dataType:'text',
                    cache: false, // Chrome && Internet Explorer has aggressive caching policies.
                    success:function(text) {
                        MediaThread.templates[self.panels[idx].template] = Mustache.template(self.panels[idx].template,text);
                        self.loadTemplates(++idx);
                }});
            }
        }
        
        this.loadContent = function() {
            for (var i = 0; i < self.panels.length; i++) {
                var panel = self.panels[i];
                jQuery("#" + self.options.container + " tr:first").hide().append(Mustache.tmpl(panel.template, panel)).show("slow");
            }
            
            // enable open/close controls
            jQuery(".pantab-container").click(function(event) {
                self.slidePanel(this, event);
            });
            
            if (self.options.chain)
                self.options.chain(self.options, self.panels);
        }
        
        this.slidePanel = function(pantab_container, event) {
            // Open/close this panhandle's panel
            var panel = jQuery(pantab_container).prevAll("td.panel-container");
            jQuery(panel[0]).toggleClass("open closed");
            
            var panelTab = jQuery(pantab_container).children("div.pantab");
            jQuery(panelTab[0]).toggleClass("open closed");
            
            self.verifyLayout(panel[0]);
        }
        
        this.openSubPanel = function(subpanel) {
            if (subpanel && !jQuery(subpanel).hasClass("open")) {
                jQuery(subpanel).toggleClass("open closed");
                
                var container = jQuery(subpanel).nextAll("td.pantab-container");
                var panelTab = jQuery(container[0]).children("div.pantab");
                jQuery(panelTab[0]).toggleClass("open closed");
                
                self.verifyLayout(subpanel);
            }
        }
        
        this.close = function() {
        }
        
        this.verifyLayout = function(panel) {
            if (jQuery(panel).hasClass("open")) {
                // Is there enough room? Does anything need to be closed?
                var screenWidth = jQuery(window).width();
                var tableWidth = jQuery("#"+self.options.container).width();
                
                if (tableWidth > screenWidth) {
                    var parent = panel;
                    
                    var parents = jQuery(panel).parents("td.panel-container");
                    if (parents && parents.length)
                        parent = parents[0];

                    var a = jQuery("#"+self.options.container).find("td.panel-container.open");
                    for (var i = a.length - 1; i >= 0 && tableWidth > screenWidth; i--) {
                        var p = a[i];
                        if (panel != p && parent != p) {
                            // close it
                            jQuery(p).toggleClass("open closed");
                            
                            var container = jQuery(p).nextAll("td.pantab-container");
                            var panelTab = jQuery(container[0]).children("div.pantab");
                            jQuery(panelTab[0]).toggleClass("open closed");
                            
                            tableWidth = jQuery("#"+self.options.container).width();
                        }
                    }
                    
                    // @todo -- once discussion is in place and we have a 3 column solution 
                    // Code should break on panel != parent, then start closing from the right, rather than from the left.
                }
            }
        }
        
    })();
})();