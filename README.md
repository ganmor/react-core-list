react-infinite-list
===================

This react component turn any list of react components into a infinite list.

Use case :
This idea is to keep the dom as small as possible.
This project is mainly target at mobile devices because they are the first to get sluggish when you scroll lists of zillions elements, but it can also be usefull on desktop.

Example of use :
--------------
 ```
var myListOfReactComponents = _.map(MyLargeJSONDataset, function (element) {
  return (<MyReactClassForElement element={element} key={element.id} />);
});

<ReactInfiniteList>
  {myListOfReactComponents}
</ReactInfiniteList>
 ```
