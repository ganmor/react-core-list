react-infinite-list
===================

This react component turn any list of react components into a infinite list.

This idea is to keep the dom as small as possible by rendering only the elements that are currently in the viewport.
The list accepts element with different sizes, that the tricky part.

Warning : The bigger the size difference between elements is, the more edge cases you will hit.
If you only need elements of equals heights, you can use one of the following projects :

You can find a much better implementation here http://github.com/Polymer/core-list, but it needs porting..

How does it work :
-----------------

The very basic : 
Only element in the current viewport are in the dom.

In more details :
On each rendering frame, the list check the scroll position if it's before the first rendered element it adds item before if it's after it add elements after. 
If it's way different, ( the new rendered elements and the previous ones do not overlap, it renders at an appoximation of the position based on items mean height.

See demo here : http://ganmor.github.io/react-infinite-list

Thoughts
--------
The current version listen to window scroll, depending on the browser, there is no way to touch the dom while the window is scrolling.
  - For chrome android/chrome ios8+ you can stay with the current version, it's pretty smooth
For older ios version, android browser and probably some more you'd better use overflow scroll inside a div.
You just need to change the implementation of getscroll

Example of use :
--------------
 ```
<ReactInfiniteList config={myConfig}>
  {myListOfReactComponents}
</ReactInfiniteList>
 ```
  Do not forget to add a key on your components !
 
Caveats :
------ 
- When hiting the bottom of the list we need to adjust this size according to real elements height
- no support of ie, it just a matter of adding the ms prefix in the transform

TODO
----
- Remove dependency to underscore
- Avoid using refs to force render of components
