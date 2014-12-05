react-infinite-list
===================

This react component turn any list of react components into a infinite list.

This idea is to keep the dom as small as possible by rendering only the elements that are currently in the viewport.
The list accepts element with different sizes, that the tricky part.


Warning : The biggerr the size differences between elements is the more edge cases you will hit.


How does it work :
-----------------

The very basic : 
Only element in the current viewport are in the dom.

In more details :
On each rendering frame, the list check the scroll position if it's before the first rendered element it adds item before if it's after it add elements after. 
If it's way different, ( the new rendered elements and the previous ones do not overlap, it renderes at an appoximation of the position based on items mean height.

Variables name sare pretty straightforward, you can have a look for yourself.

See demo here : http://ganmor.github.io/react-infinite-list

Example of use :
--------------

Config
```
{
  DEFAULT_ITEM_HEIGHT : 'value'
  // Default value is 50, this is used the compute an average size for the list
}
```

Use
 ```
<ReactInfiniteList config={myConfig}>
  {myListOfReactComponents}
</ReactInfiniteList>
 ```
 
Caveats :
------ 
- When hiting the bottom of the list we need to adjust this size according to real elements height
- no support of ie, it just a matter of adding the ms prefix in the transform
- only support div overflow scroll, it should work while scrolling on the window

