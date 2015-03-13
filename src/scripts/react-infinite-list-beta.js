var React = require('react');


var AbsoluteElement = React.createClass({

  proptTypes : {
    startRender : React.proptType.Number, // The minium rendereded position
    endeRender : React.proptType.Number // The maximum rendered position
  },

  componentDidMount : function () {
    // TODO report size ?
    this.props.

  },

  render : function  {
     return (
      <div>

      </div>);
    }
});


var InfiniteList = React.createClass({

    // Local cache of scrollTop
    _scrollTop: 0,

    ready: function() {
      this._boundScrollHandler = this.scrollHandler.bind(this);
      this._boundPositionItems = this._positionItems.bind(this);
      this._oldMulti = this.multi;
      this._oldSelectionEnabled = this.selectionEnabled;
      this._virtualStart = 0;
      this._virtualCount = 0;
      this._physicalStart = 0;
      this._physicalOffset = 0;
      this._physicalSize = 0;
      this._physicalSizes = [];
      this._physicalAverage = 0;
      this._itemSizes = [];
      this._dividerSizes = [];
      this._repositionedItems = [];
      this._aboveSize = 0;
      this._nestedGroups = false;
      this._groupStart = 0;
      this._groupStartIndex = 0;
    },

    attached: function() {
      this.isAttached = true;
      this.template = this.querySelector('template');
      if (!this.template.bindingDelegate) {
        this.template.bindingDelegate = this.element.syntax;
      }
      this.resizableAttachedHandler();
    },

    detached: function() {
      this.isAttached = false;
      if (this._target) {
        this._target.removeEventListener('scroll', this._boundScrollHandler);
      }
      this.resizableDetachedHandler();
    },

    /**
     * To be called by the user when the list is manually resized
     * or shown after being hidden.
     *
     * @method updateSize
     */

    updateSize: function() {
      if (!this._positionPending && !this._needItemInit) {
        this._resetIndex(this._getFirstVisibleIndex() || 0);
        this.initialize();
      }
    },

    _resetSelection: function() {
      if (((this._oldMulti != this.multi) && !this.multi) ||
          ((this._oldSelectionEnabled != this.selectionEnabled) &&
            !this.selectionEnabled)) {
        this._clearSelection();
        this.refresh();
      } else {
        this.selection = this.$.selection.getSelection();
      }
      this._oldMulti = this.multi;
      this._oldSelectionEnabled = this.selectionEnabled;
    },

    // Adjust virtual start index based on changes to backing data
    _adjustVirtualIndex: function(splices, group) {
      if (this._targetSize === 0) {
        return;
      }
      var totalDelta = 0;
      for (var i=0; i<splices.length; i++) {
        var s = splices[i];
        var idx = s.index;
        var gidx, gitem;
        if (group) {
          gidx = this.data.indexOf(group);
          idx += this.virtualIndexForGroup(gidx);
        }
        // We only need to care about changes happening above the current position
        if (idx >= this._virtualStart) {
          break;
        }
        var delta = Math.max(s.addedCount - s.removed.length, idx - this._virtualStart);
        totalDelta += delta;
        this._physicalStart += delta;
        this._virtualStart += delta;
        if (this._grouped) {
          if (group) {
            gitem = s.index;
          } else {
            var g = this.groupForVirtualIndex(s.index);
            gidx = g.group;
            gitem = g.groupIndex;
          }
          if (gidx == this._groupStart && gitem < this._groupStartIndex) {
            this._groupStartIndex += delta;
          }
        }
      }
      // Adjust offset/scroll position based on total number of items changed
      if (this._virtualStart < this._physicalCount) {
        this._resetIndex(this._getFirstVisibleIndex() || 0);
      } else {
        totalDelta = Math.max((totalDelta / this._rowFactor) * this._physicalAverage, -this._physicalOffset);
        this._physicalOffset += totalDelta;
        this._scrollTop = this.setScrollTop(this._scrollTop + totalDelta);
      }
    },
    _updateSelection: function(splices) {
      for (var i=0; i<splices.length; i++) {
        var s = splices[i];
        for (var j=0; j<s.removed.length; j++) {
          var d = s.removed[j];
          this.$.selection.setItemSelected(d, false);
        }
      }
    },
    groupsChanged: function() {
      if (!!this.groups != this._grouped) {
        this.updateSize();
      }
    },
    initialize: function() {
      if (!this.template || !this.isAttached) {
        return;
      }
      // TODO(kschaaf): Checking arguments.length currently the only way to
      // know that the array was mutated as opposed to newly assigned; need
      // a better API for Polymer observers
      var splices;
      if (arguments.length == 1) {
        splices = arguments[0];
        if (!this._nestedGroups) {
          this._adjustVirtualIndex(splices);
        }
        this._updateSelection(splices);
      } else {
        this._clearSelection();
      }
      // Initialize scroll target
      var target = this.scrollTarget || this;
      if (this._target !== target) {
        this.initializeScrollTarget(target);
      }
      // Initialize data
      this.initializeData(splices, false);
    },
    initializeScrollTarget: function(target) {
      // Listen for scroll events
      if (this._target) {
        this._target.removeEventListener('scroll', this._boundScrollHandler, false);
      }
      this._target = target;
      target.addEventListener('scroll', this._boundScrollHandler, false);
      // Support for non-native scrollers (must implement abstract API):
      // getScrollTop, setScrollTop, sync
      if ((target != this) && target.setScrollTop && target.getScrollTop) {
        this.setScrollTop = function(val) {
          target.setScrollTop(val);
          return target.getScrollTop();
        };
        this.getScrollTop = target.getScrollTop.bind(target);
        this.syncScroller = target.sync ? target.sync.bind(target) : function() {};
        // Adjusting scroll position on non-native scrollers is risky
        this.adjustPositionAllowed = false;
      } else {
        this.setScrollTop = function(val) {
          target.scrollTop = val;
          return target.scrollTop;
        };
        this.getScrollTop = function() {
          return target.scrollTop;
        };
        this.syncScroller = function() {};
        this.adjustPositionAllowed = true;
      }
      // Only use -webkit-overflow-touch from iOS8+, where scroll events are fired
      if (IOS_TOUCH_SCROLLING) {
        target.style.webkitOverflowScrolling = 'touch';
        // Adjusting scrollTop during iOS momentum scrolling is "no bueno"
        this.adjustPositionAllowed = false;
      }
      // Force overflow as necessary
      this._target.style.willChange = 'transform';
      if (getComputedStyle(this._target).position == 'static') {
        this._target.style.position = 'relative';
      }
      this._target.style.boxSizing = this._target.style.mozBoxSizing = 'border-box';
      this.style.overflowY = (target == this) ? 'auto' : null;
    },
    updateGroupObservers: function(splices) {
      // If we're going from grouped to non-grouped, remove all observers
      if (!this._nestedGroups) {
        if (this._groupObservers && this._groupObservers.length) {
          splices = [{
            index: 0,
            addedCount: 0,
            removed: this._groupObservers
          }];
        } else {
          splices = null;
        }
      }
      // Otherwise, create observers for all groups, unless this is a group splice
      if (this._nestedGroups) {
        splices = splices || [{
          index: 0,
          addedCount: this.data.length,
          removed: []
        }];
      }
      if (splices) {
        var observers = this._groupObservers || [];
        // Apply the splices to the observer array
        for (var i=0; i<splices.length; i++) {
          var s = splices[i], j;
          var args = [s.index, s.removed.length];
          if (s.removed.length) {
            for (j=s.index; j<s.removed.length; j++) {
              observers[j].close();
            }
          }
          if (s.addedCount) {
            for (j=s.index; j<s.addedCount; j++) {
              var o = new ArrayObserver(this.data[j]);
              args.push(o);
              o.open(this.getGroupDataHandler(this.data[j]));
            }
          }
          observers.splice.apply(observers, args);
        }
        this._groupObservers = observers;
      }
    },
    getGroupDataHandler: function(group) {
      return function(splices) {
        this.groupDataChanged(splices, group);
      }.bind(this);
    },
    groupDataChanged: function(splices, group) {
      this._adjustVirtualIndex(splices, group);
      this._updateSelection(splices);
      this.initializeData(null, true);
    },
    initializeData: function(splices, groupUpdate) {
      var i;
      // Calculate row-factor for grid layout
      if (this.grid) {
        if (!this.width) {
          throw 'Grid requires the `width` property to be set';
        }
        var cs = getComputedStyle(this._target);
        var padding = parseInt(cs.paddingLeft || 0) + parseInt(cs.paddingRight || 0);
        this._rowFactor = Math.floor((this._target.offsetWidth - padding) / this.width) || 1;
        this._rowMargin = (this._target.offsetWidth - (this._rowFactor * this.width) - padding) / 2;
      } else {
        this._rowFactor = 1;
        this._rowMargin = 0;
      }
      // Count virtual data size, depending on whether grouping is enabled
      if (!this.data || !this.data.length) {
        this._virtualCount = 0;
        this._grouped = false;
        this._nestedGroups = false;
      } else if (this.groups) {
        this._grouped = true;
        this._nestedGroups = Array.isArray(this.data[0]);
        if (this._nestedGroups) {
          if (this.groups.length != this.data.length) {
            throw 'When using nested grouped data, data.length and groups.length must agree!';
          }
          this._virtualCount = 0;
          for (i=0; i<this.groups.length; i++) {
            this._virtualCount += this.data[i] && this.data[i].length;
          }
        } else {
          this._virtualCount = this.data.length;
          var len = 0;
          for (i=0; i<this.groups.length; i++) {
            len += this.groups[i].length;
          }
          if (len != this.data.length) {
            throw 'When using groups data, the sum of group[n].length\'s and data.length must agree!';
          }
        }
        var g = this.groupForVirtualIndex(this._virtualStart);
        this._groupStart = g.group;
        this._groupStartIndex = g.groupIndex;
      } else {
        this._grouped = false;
        this._nestedGroups = false;
        this._virtualCount = this.data.length;
      }
      // Update grouped array observers used when group data is nested
      if (!groupUpdate) {
        this.updateGroupObservers(splices);
      }

      // Add physical items up to a max based on data length, viewport size, and extra item overhang
      var currentCount = this._physicalCount || 0;
      var height = this._target.offsetHeight;
      if (!height && this._target.offsetParent) {
        console.warn('core-list must either be sized or be inside an overflow:auto div that is sized');
      }
      this._physicalCount = Math.min(Math.ceil(height / (this._physicalAverage || this.height)) * this.runwayFactor * this._rowFactor, this._virtualCount);
      this._physicalCount = Math.max(currentCount, this._physicalCount);
      this._physicalData = this._physicalData || new Array(this._physicalCount);
      var needItemInit = false;
      while (currentCount < this._physicalCount) {
        var model = this.templateInstance ? Object.create(this.templateInstance.model) : {};
        this._physicalData[currentCount++] = model;
        needItemInit = true;
      }
      this.template.model = this._physicalData;
      this.template.setAttribute('repeat', '');
      this._dir = 0;
      // If we've added new items, wait until the template renders then
      // initialize the new items before refreshing
      if (!this._needItemInit) {
        if (needItemInit) {
          this._needItemInit = true;
          this.resetMetrics();
          this.onMutation(this, this.initializeItems);
        } else {
          this.refresh();
        }
      }
    },
    initializeItems: function() {
      var currentCount = this._physicalItems && this._physicalItems.length || 0;
      this._physicalItems = this._physicalItems || [new Array(this._physicalCount)];
      this._physicalDividers = this._physicalDividers || new Array(this._physicalCount);
      for (var i = 0, item = this.template.nextElementSibling;
           item && i < this._physicalCount;
           item = item.nextElementSibling) {
        if (item.getAttribute('divider') != null) {
          this._physicalDividers[i] = item;
        } else {
          this._physicalItems[i++] = item;
        }
      }
      this.refresh();
      this._needItemInit = false;
    },
    _updateItemData: function(force, physicalIndex, virtualIndex, groupIndex, groupItemIndex) {
      var physicalItem = this._physicalItems[physicalIndex];
      var physicalDatum = this._physicalData[physicalIndex];
      var virtualDatum = this.dataForIndex(virtualIndex, groupIndex, groupItemIndex);
      var needsReposition;
      if (force || physicalDatum.model != virtualDatum) {
        // Set model, index, and selected fields
        physicalDatum.model = virtualDatum;
        physicalDatum.index = virtualIndex;
        physicalDatum.physicalIndex = physicalIndex;
        physicalDatum.selected = this.selectionEnabled && virtualDatum ?
            this._selectedData.get(virtualDatum) : null;
        // Set group-related fields
        if (this._grouped) {
          var groupModel = this.groups[groupIndex];
          physicalDatum.groupModel = groupModel && (this._nestedGroups ? groupModel : groupModel.data);
          physicalDatum.groupIndex = groupIndex;
          physicalDatum.groupItemIndex = groupItemIndex;
          physicalItem._isDivider = this.data.length && (groupItemIndex === 0);
          physicalItem._isRowStart = (groupItemIndex % this._rowFactor) === 0;
        } else {
          physicalDatum.groupModel = null;
          physicalDatum.groupIndex = null;
          physicalDatum.groupItemIndex = null;
          physicalItem._isDivider = false;
          physicalItem._isRowStart = (virtualIndex % this._rowFactor) === 0;
        }
        // Hide physical items when not in use (no model assigned)
        physicalItem.hidden = !virtualDatum;
        var divider = this._physicalDividers[physicalIndex];
        if (divider && (divider.hidden == physicalItem._isDivider)) {
          divider.hidden = !physicalItem._isDivider;
        }
        needsReposition = !force;
      } else {
        needsReposition = false;
      }
      return needsReposition || force;
    },
    scrollHandler: function() {
      if (IOS_TOUCH_SCROLLING) {
        // iOS sends multiple scroll events per rAF
        // Align work to rAF to reduce overhead & artifacts
        if (!this._raf) {
          this._raf = requestAnimationFrame(function() {
            this._raf = null;
            this.refresh();
          }.bind(this));
        }
      } else {
        this.refresh();
      }
    },
    resetMetrics: function() {
      this._physicalAverage = 0;
      this._physicalAverageCount = 0;
    },
    updateMetrics: function(force) {
      // Measure physical items & dividers
      var totalSize = 0;
      var count = 0;
      for (var i=0; i<this._physicalCount; i++) {
        var item = this._physicalItems[i];
        if (!item.hidden) {
          var size = this._itemSizes[i] = item.offsetHeight;
          if (item._isDivider) {
            var divider = this._physicalDividers[i];
            if (divider) {
              size += (this._dividerSizes[i] = divider.offsetHeight);
            }
          }
          this._physicalSizes[i] = size;
          if (item._isRowStart) {
            totalSize += size;
            count++;
          }
        }
      }
      this._physicalSize = totalSize;
      // Measure other DOM
      this._viewportSize = this.$.viewport.offsetHeight;
      this._targetSize = this._target.offsetHeight;
      // Measure content in scroller before virtualized items
      if (this._target != this) {
        this._aboveSize = this.offsetTop;
      } else {
        this._aboveSize = parseInt(getComputedStyle(this._target).paddingTop);
      }
      // Calculate average height
      if (count) {
        totalSize = (this._physicalAverage * this._physicalAverageCount) + totalSize;
        this._physicalAverageCount += count;
        this._physicalAverage = Math.round(totalSize / this._physicalAverageCount);
      }
    },
    getGroupLen: function(group) {
      group = arguments.length ? group : this._groupStart;
      if (this._nestedGroups) {
        return this.data[group].length;
      } else {
        return this.groups[group].length;
      }
    },
    changeStartIndex: function(inc) {
      this._virtualStart += inc;
      if (this._grouped) {
        while (inc > 0) {
          var groupMax = this.getGroupLen() - this._groupStartIndex - 1;
          if (inc > groupMax) {
            inc -= (groupMax + 1);
            this._groupStart++;
            this._groupStartIndex = 0;
          } else {
            this._groupStartIndex += inc;
            inc = 0;
          }
        }
        while (inc < 0) {
          if (-inc > this._groupStartIndex) {
            inc += this._groupStartIndex;
            this._groupStart--;
            this._groupStartIndex = this.getGroupLen();
          } else {
            this._groupStartIndex += inc;
            inc = this.getGroupLen();
          }
        }
      }
      // In grid mode, virtualIndex must alway start on a row start!
      if (this.grid) {
        if (this._grouped) {
          inc = this._groupStartIndex % this._rowFactor;
        } else {
          inc = this._virtualStart % this._rowFactor;
        }
        if (inc) {
          this.changeStartIndex(-inc);
        }
      }
    },
    getRowCount: function(dir) {
      if (!this.grid) {
        return dir;
      } else if (!this._grouped) {
        return dir * this._rowFactor;
      } else {
        if (dir < 0) {
          if (this._groupStartIndex > 0) {
            return -Math.min(this._rowFactor, this._groupStartIndex);
          } else {
            var prevLen = this.getGroupLen(this._groupStart-1);
            return -Math.min(this._rowFactor, prevLen % this._rowFactor || this._rowFactor);
          }
        } else {
          return Math.min(this._rowFactor, this.getGroupLen() - this._groupStartIndex);
        }
      }
    },
    _virtualToPhysical: function(virtualIndex) {
      var physicalIndex = (virtualIndex - this._physicalStart) % this._physicalCount;
      return physicalIndex < 0 ? this._physicalCount + physicalIndex : physicalIndex;
    },
    groupForVirtualIndex: function(virtual) {
      if (!this._grouped) {
        return {};
      } else {
        var group;
        for (group=0; group<this.groups.length; group++) {
          var groupLen = this.getGroupLen(group);
          if (groupLen > virtual) {
            break;
          } else {
            virtual -= groupLen;
          }
        }
        return {group: group, groupIndex: virtual };
      }
    },
    virtualIndexForGroup: function(group, groupIndex) {
      groupIndex = groupIndex ? Math.min(groupIndex, this.getGroupLen(group)) : 0;
      group--;
      while (group >= 0) {
        groupIndex += this.getGroupLen(group--);
      }
      return groupIndex;
    },
    dataForIndex: function(virtual, group, groupIndex) {
      if (this.data) {
        if (this._nestedGroups) {
          if (virtual < this._virtualCount) {
            return this.data[group][groupIndex];
          }
        } else {
          return this.data[virtual];
        }
      }
    },
    // Refresh the list at the current scroll position.
    refresh: function() {
      var i, deltaCount;
      // Determine scroll position & any scrollDelta that may have occurred
      var lastScrollTop = this._scrollTop;
      this._scrollTop = this.getScrollTop();
      var scrollDelta = this._scrollTop - lastScrollTop;
      this._dir = scrollDelta < 0 ? -1 : scrollDelta > 0 ? 1 : 0;
      // Adjust virtual items and positioning offset if scroll occurred
      if (Math.abs(scrollDelta) > Math.max(this._physicalSize, this._targetSize)) {
        // Random access to point in list: guess new index based on average size
        deltaCount = Math.round((scrollDelta / this._physicalAverage) * this._rowFactor);
        deltaCount = Math.max(deltaCount, -this._virtualStart);
        deltaCount = Math.min(deltaCount, this._virtualCount - this._virtualStart - 1);
        this._physicalOffset += Math.max(scrollDelta, -this._physicalOffset);
        this.changeStartIndex(deltaCount);
        // console.log(this._scrollTop, 'Random access to ' + this._virtualStart, this._physicalOffset);
      } else {
        // Incremental movement: adjust index by flipping items
        var base = this._aboveSize + this._physicalOffset;
        var margin = 0.3 * Math.max((this._physicalSize - this._targetSize, this._physicalSize));
        this._upperBound = base + margin;
        this._lowerBound = base + this._physicalSize - this._targetSize - margin;
        var flipBound = this._dir > 0 ? this._upperBound : this._lowerBound;
        if (((this._dir > 0 && this._scrollTop > flipBound) ||
             (this._dir < 0 && this._scrollTop < flipBound))) {
          var flipSize = Math.abs(this._scrollTop - flipBound);
          for (i=0; (i<this._physicalCount) && (flipSize > 0) &&
              ((this._dir < 0 && this._virtualStart > 0) ||
               (this._dir > 0 && this._virtualStart < this._virtualCount-this._physicalCount)); i++) {
            var idx = this._virtualToPhysical(this._dir > 0 ?
              this._virtualStart :
              this._virtualStart + this._physicalCount -1);
            var size = this._physicalSizes[idx];
            flipSize -= size;
            var cnt = this.getRowCount(this._dir);
            // console.log(this._scrollTop, 'flip ' + (this._dir > 0 ? 'down' : 'up'), cnt, this._virtualStart, this._physicalOffset);
            if (this._dir > 0) {
              // When scrolling down, offset is adjusted based on previous item's size
              this._physicalOffset += size;
              // console.log('  ->', this._virtualStart, size, this._physicalOffset);
            }
            this.changeStartIndex(cnt);
            if (this._dir < 0) {
              this._repositionedItems.push(this._virtualStart);
            }
          }
        }
      }
      // Assign data to items lazily if scrolling, otherwise force
      if (this._updateItems(!scrollDelta)) {
        // Position items after bindings resolve (method varies based on O.o impl)
        if (Observer.hasObjectObserve) {
          this.async(this._boundPositionItems);
        } else {
          Platform.flush();
          Platform.endOfMicrotask(this._boundPositionItems);
        }
      }
    },
    _updateItems: function(force) {
      var i, virtualIndex, physicalIndex;
      var needsReposition = false;
      var groupIndex = this._groupStart;
      var groupItemIndex = this._groupStartIndex;
      for (i = 0; i < this._physicalCount; ++i) {
        virtualIndex = this._virtualStart + i;
        physicalIndex = this._virtualToPhysical(virtualIndex);
        // Update physical item with new user data and list metadata
        needsReposition =
          this._updateItemData(force, physicalIndex, virtualIndex, groupIndex, groupItemIndex) || needsReposition;
        // Increment
        groupItemIndex++;
        if (this.groups && groupIndex < this.groups.length - 1) {
          if (groupItemIndex >= this.getGroupLen(groupIndex)) {
            groupItemIndex = 0;
            groupIndex++;
          }
        }
      }
      return needsReposition;
    },
    _positionItems: function() {
      var i, virtualIndex, physicalIndex, physicalItem;
      // Measure
      this.updateMetrics();
      // Pre-positioning tasks
      if (this._dir < 0) {
        // When going up, remove offset after measuring size for
        // new data for item being moved from bottom to top
        while (this._repositionedItems.length) {
          virtualIndex = this._repositionedItems.pop();
          physicalIndex = this._virtualToPhysical(virtualIndex);
          this._physicalOffset -= this._physicalSizes[physicalIndex];
          // console.log('  <-', virtualIndex, this._physicalSizes[physicalIndex], this._physicalOffset);
        }
        // Adjust scroll position to home into top when going up
        if (this._scrollTop + this._targetSize < this._viewportSize) {
          this._updateScrollPosition(this._scrollTop);
        }
      }
      // Position items
      var divider, upperBound, lowerBound;
      var rowx = 0;
      var x = this._rowMargin;
      var y = this._physicalOffset;
      var lastHeight = 0;
      for (i = 0; i < this._physicalCount; ++i) {
        // Calculate indices
        virtualIndex = this._virtualStart + i;
        physicalIndex = this._virtualToPhysical(virtualIndex);
        physicalItem = this._physicalItems[physicalIndex];
        // Position divider
        if (physicalItem._isDivider) {
          if (rowx !== 0) {
            y += lastHeight;
            rowx = 0;
          }
          divider = this._physicalDividers[physicalIndex];
          x = this._rowMargin;
          if (divider && (divider._translateX != x || divider._translateY != y)) {
            divider.style.opacity = 1;
            if (this.grid) {
              divider.style.width = this.width * this._rowFactor + 'px';
            }
            divider.style.transform = divider.style.webkitTransform =
              'translate3d(' + x + 'px,' + y + 'px,0)';
            divider._translateX = x;
            divider._translateY = y;
          }
          y += this._dividerSizes[physicalIndex];
        }
        // Position item
        if (physicalItem._translateX != x || physicalItem._translateY != y) {
          physicalItem.style.opacity = 1;
          physicalItem.style.transform = physicalItem.style.webkitTransform =
            'translate3d(' + x + 'px,' + y + 'px,0)';
          physicalItem._translateX = x;
          physicalItem._translateY = y;
        }
        // Increment offsets
        lastHeight = this._itemSizes[physicalIndex];
        if (this.grid) {
          rowx++;
          if (rowx >= this._rowFactor) {
            rowx = 0;
            y += lastHeight;
          }
          x = this._rowMargin + rowx * this.width;
        } else {
          y += lastHeight;
        }
      }
      if (this._scrollTop >= 0) {
        this._updateViewportHeight();
      }
    },
    _updateViewportHeight: function() {
      var remaining = Math.max(this._virtualCount - this._virtualStart - this._physicalCount, 0);
      remaining = Math.ceil(remaining / this._rowFactor);
      var vs = this._physicalOffset + this._physicalSize + remaining * this._physicalAverage;
      if (this._viewportSize != vs) {
        // console.log(this._scrollTop, 'adjusting viewport height', vs - this._viewportSize, vs);
        this._viewportSize = vs;
        this.$.viewport.style.height = this._viewportSize + 'px';
        this.syncScroller();
      }
    },
    _updateScrollPosition: function(scrollTop) {
      var deltaHeight = this._virtualStart === 0 ? this._physicalOffset :
        Math.min(scrollTop + this._physicalOffset, 0);
      if (deltaHeight) {
        // console.log(scrollTop, 'adjusting scroll pos', this._virtualStart, -deltaHeight, scrollTop - deltaHeight);
        if (this.adjustPositionAllowed) {
          this._scrollTop = this.setScrollTop(scrollTop - deltaHeight);
        }
        this._physicalOffset -= deltaHeight;
      }
    },
    // list selection
    tapHandler: function(e) {
      var n = e.target;
      var p = e.path;
      if (!this.selectionEnabled || (n === this)) {
        return;
      }
      requestAnimationFrame(function() {
        // Gambit: only select the item if the tap wasn't on a focusable child
        // of the list (since anything with its own action should be focusable
        // and not result in result in list selection).  To check this, we
        // asynchronously check that shadowRoot.activeElement is null, which
        // means the tapped item wasn't focusable. On polyfill where
        // activeElement doesn't follow the data-hinding part of the spec, we
        // can check that document.activeElement is the list itself, which will
        // catch focus in lieu of the tapped item being focusable, as we make
        // the list focusable (tabindex="-1") for this purpose.  Note we also
        // allow the list items themselves to be focusable if desired, so those
        // are excluded as well.
        var active = window.ShadowDOMPolyfill ?
            wrap(document.activeElement) : this.shadowRoot.activeElement;
        if (active && (active != this) && (active.parentElement != this) &&
            (document.activeElement != document.body)) {
          return;
        }
        // Unfortunately, Safari does not focus certain form controls via mouse,
        // so we also blacklist input, button, & select
        // (https://bugs.webkit.org/show_bug.cgi?id=118043)
        if ((p[0].localName == 'input') ||
            (p[0].localName == 'button') ||
            (p[0].localName == 'select')) {
          return;
        }
        var model = n.templateInstance && n.templateInstance.model;
        if (model) {
          var data = this.dataForIndex(model.index, model.groupIndex, model.groupItemIndex);
          var item = this._physicalItems[model.physicalIndex];
          if (!this.multi && data == this.selection) {
            this.$.selection.select(null);
          } else {
            this.$.selection.select(data);
          }
          this.asyncFire('core-activate', {data: data, item: item});
        }
      }.bind(this));
    },
    selectedHandler: function(e, detail) {
      this.selection = this.$.selection.getSelection();
      var id = this.indexesForData(detail.item);
      // TODO(sorvell): we should be relying on selection to store the
      // selected data but we want to optimize for lookup.
      this._selectedData.set(detail.item, detail.isSelected);
      if (id.physical >= 0 && id.virtual >= 0) {
        this.refresh();
      }
    },
    /**
     * Select the list item at the given index.
     *
     * @method selectItem
     * @param {number} index
     */
    selectItem: function(index) {
      if (!this.selectionEnabled) {
        return;
      }
      var data = this.data[index];
      if (data) {
        this.$.selection.select(data);
      }
    },
    /**
     * Set the selected state of the list item at the given index.
     *
     * @method setItemSelected
     * @param {number} index
     * @param {boolean} isSelected
     */
    setItemSelected: function(index, isSelected) {
      var data = this.data[index];
      if (data) {
        this.$.selection.setItemSelected(data, isSelected);
      }
    },
    indexesForData: function(data) {
      var virtual = -1;
      var groupsLen = 0;
      if (this._nestedGroups) {
        for (var i=0; i<this.groups.length; i++) {
          virtual = this.data[i].indexOf(data);
          if (virtual < 0) {
            groupsLen += this.data[i].length;
          } else {
            virtual += groupsLen;
            break;
          }
        }
      } else {
        virtual = this.data.indexOf(data);
      }
      var physical = this.virtualToPhysicalIndex(virtual);
      return { virtual: virtual, physical: physical };
    },
    virtualToPhysicalIndex: function(index) {
      for (var i=0, l=this._physicalData.length; i<l; i++) {
        if (this._physicalData[i].index === index) {
          return i;
        }
      }
      return -1;
    },
    /**
     * Clears the current selection state of the list.
     *
     * @method clearSelection
     */
    clearSelection: function() {
      this._clearSelection();
      this.refresh();
    },
    _clearSelection: function() {
      this._selectedData = new WeakMap();
      this.$.selection.clear();
      this.selection = this.$.selection.getSelection();
    },
    _getFirstVisibleIndex: function() {
      for (var i=0; i<this._physicalCount; i++) {
        var virtualIndex = this._virtualStart + i;
        var physicalIndex = this._virtualToPhysical(virtualIndex);
        var item = this._physicalItems[physicalIndex];
        if (!item.hidden && item._translateY >= this._scrollTop - this._aboveSize) {
          return virtualIndex;
        }
      }
    },
    _resetIndex: function(index) {
      index = Math.min(index, this._virtualCount-1);
      index = Math.max(index, 0);
      this.changeStartIndex(index - this._virtualStart);
      this._scrollTop = this.setScrollTop(this._aboveSize + (index / this._rowFactor) * this._physicalAverage);
      this._physicalOffset = this._scrollTop - this._aboveSize;
      this._dir = 0;
    },
    /**
     * Scroll to an item.
     *
     * Note, when grouping is used, the index is based on the
     * total flattened number of items.  For scrolling to an item
     * within a group, use the `scrollToGroupItem` API.
     *
     * @method scrollToItem
     * @param {number} index
     */
    scrollToItem: function(index) {
      this.scrollToGroupItem(null, index);
    },
    /**
     * Scroll to a group.
     *
     * @method scrollToGroup
     * @param {number} group
     */
    scrollToGroup: function(group) {
      this.scrollToGroupItem(group, 0);
    },
    /**
     * Scroll to an item within a group.
     *
     * @method scrollToGroupItem
     * @param {number} group
     * @param {number} index
     */
    scrollToGroupItem: function(group, index) {
      if (group != null) {
        index = this.virtualIndexForGroup(group, index);
      }
      this._resetIndex(index);
      this.refresh();
    }

  render : function () {

    var height = (this.props.children.length * this.props.itemHeight || this.defaultItemHeight);
    var containerSize =  {
      height : height
    };

    return (
      <div style={containerSize}>
        {this.props.children.length} {containerSize.height}
      </div>);
  }
});

module.exports = InfiniteList;


