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

```
{
  DEFAULT_ITEM_HEIGHT : 'value' // Default value is 50, this is used the to compute an average size for the list
}
```

 ```
var myListOfReactComponents = _.map(MyLargeJSONDataset, function (element) {
  return (<MyReactClassForElement element={element} key={element.id} />);
});

<ReactInfiniteList config={myConfig}>
  {myListOfReactComponents}
</ReactInfiniteList>
 ```
 
Caveats :
------ 
- There is still some optimization to be made on the boundaries
- We should be able to make it work on the window ( as opposed to inside a div with overflow scroll )

