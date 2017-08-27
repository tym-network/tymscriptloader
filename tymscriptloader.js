
(function() {
    var scripts = {};
    var groups = {};

    var createGroup = function(groupName) {
        groups[groupName] = {
            notifyOnLoad: [],
            loadedDependencies: [],
            members: []
        };
    };

    var prepareLoad = function(noDependencyScripts) {
        var requiredScriptId;
        var groupId;

        for (var script in scripts) {
            // Create props
            scripts[script].id = script;
            scripts[script].notifyOnLoad = [];
            scripts[script].loadedDependencies = [];

            if (!scripts[script].requires) {
                // The script doesn't have dependencies
                noDependencyScripts.push(script);
            } else {
                for (var require in scripts[script].requires) {
                    requiredScriptId = scripts[script].requires[require];
                    if (scripts[requiredScriptId]) {
                        // It's a script
                        scripts[requiredScriptId].notifyOnLoad.push(script);
                    } else if (groups[requiredScriptId]) {
                        // It's an existing group
                        groups[requiredScriptId].notifyOnLoad.push(script);
                    } else {
                        // It's a new group
                        createGroup(requiredScriptId);
                        groups[requiredScriptId].notifyOnLoad.push(script);
                    }
                }
            }

            // If the script belongs to a group add script to group's members
            if (scripts[script].groups) {
                for (var group in scripts[script].groups) {
                    groupId = scripts[script].groups[group];
                    if (!groups[groupId]) {
                        createGroup(groupId);
                    }
                    groups[groupId].members.push(script);
                }
            }
        }
    };

    var onScriptLoad = function(script) {
        var toNotifyId;
        var groupId;

        for (var toNotify in script.notifyOnLoad) {
            toNotifyId = script.notifyOnLoad[toNotify];
            scripts[toNotifyId].loadedDependencies.push(script.id);

            if (scripts[toNotifyId].loadedDependencies.length === scripts[toNotifyId].requires.length) {
                // All dependencies are loaded
                createScript(scripts[toNotifyId], groups);
            }

        }
        // Check groups
        if (script.groups) {
            for (var group in script.groups) {
                groupId = script.groups[group];
                groups[groupId].loadedDependencies.push(script.id);
                if (groups[groupId].loadedDependencies.length === groups[groupId].members.length) {
                    // It's the last script of the group, create dependencies
                    onScriptLoad(groups[groupId]);
                }
            }
        }
    };

    var createScript = function(script) {
        var el = document.createElement('script');
        el.addEventListener('load', function() {
            onScriptLoad(script);
        });
        el.src = script.source;

        document.body.appendChild(el);
    }

    var loadScripts = function() {
        var noDependencyScripts = [];
        prepareLoad(noDependencyScripts);

        for (var i = 0, l = noDependencyScripts.length; i < l; i++) {
            createScript(scripts[noDependencyScripts[i]]);
        }
    };

    window.tymScriptLoader = function(s) {
        scripts = s;
        loadScripts();
    };
})();