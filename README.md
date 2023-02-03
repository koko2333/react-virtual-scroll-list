## 手把手教你用`React Hook`和`TypeScript`从零实现虚拟滚动列表组件

### 1.要做什么？

首先我们要明确我们需要做什么。实现虚拟滚动组件的意义在于渲染巨量数据时，无论用户怎么滚动，浏览器始终只渲染用户可见的那些数据，减少 dom 的渲染数量从而减少性能消耗。所以这就是我们这次要做的工作。

### 2.如何实现？

我们最先想到的应该先渲染超过一屏一点的数据，然后随着列表的滑动，我们从数据池中筛选出新的数据替换老的数据。但是这里会有一个问题，那就是随着我们列表的滑动，我们列表中的数据量并没有增多，列表的高度没有发生变化，这样很快滚动条就触底了，就再也无法滑动了。所以为了解决这个问题，我们需要给列表内容加上一`transform: translateY(${offSetY}px)`的向下的偏移量；当我们的滚动条滚了多少（内容向上卷起多少）那我们就给`offSetY`设置为多少，让列表往下偏移多少。那么这样我们的列表就可以一直滑动。ok，那让我们用代码实现试试。

### 3.代码实现

1. <h5>获取一页可以显示多少个节点和首次渲染</h5>首先我们要知道一页能够显示多少个节点，这样我们才可以确定渲染多少个节点在页面上。所以首先，我们要获取单个节点的高度和页面的高度。我们可以先渲染出一个节点，然后通过浏览器 dom 的 api 来获取我们所需的数据：

   ```tsx
   import React, { useState, useEffect, useRef } from "react";
   import "./index.css";

   const getTestData = (length: number): string[] => {
     let dataList: string[] = [];
     for (let i = 0; i < length; i++) {
       dataList = [...dataList, `测试数据${Math.ceil(Math.random() * 10)}`];
     }
     return dataList;
   };

   const redundancy = 4; // 冗余量 渲染节点数 = 一页能渲染多少个节点 + 冗余量

   // 获取虚拟列表展示的数据
   const getRenderList: <T>(
     list: T[],
     renderLength: number,
     start?: number
   ) => T[] = (list, renderLength, start) => {
     start = start || 0;
     return list.slice(start, start + renderLength);
   };

   function VirtualScrollList() {
     const [dataList, setDataList] = useState<string[]>([]); // 所有的数据
     const [renderList, setRenderList] = useState<string[]>([]); // 需要渲染的数据
     const [offSetY, setOffSetY] = useState<number>(0); // 向下的偏移量

     // 不会触发渲染的变量推荐用useRef进行维护
     const renderLength = useRef<number>(0); // 一页能渲染多少个节点
     const rowNodeHeight = useRef<number>(0); // 一个节点有多高

     // 获取虚拟列表渲染多少个
     const getRenderLength = (): number => {
       const containerNode: HTMLDivElement | null = document.querySelector(
         ".virtual_scroll_container"
       );
       const rowNode: HTMLDivElement | null = document.querySelector(
         ".virtual_scroll_row"
       );
       if (containerNode && rowNode) {
         rowNodeHeight.current = rowNode.clientHeight;
         return (
           Math.ceil(containerNode.clientHeight / rowNodeHeight.current) +
           redundancy
         ); // 一页能渲染多少个节点 + 冗余量
       }
       return 0;
     };

     // todo: 列表滚动中
     const handleTableScroll = (e: React.UIEvent<HTMLDivElement>): void => {};

     useEffect(() => {
       setDataList(getTestData(100));
     }, []);

     useEffect(() => {
       setRenderList(dataList.slice(0, 1)); // 先渲染一个
     }, [dataList]);

     useEffect(() => {
       // 渲染一行后获取一页能渲染多少个以及单个的高度
       if (renderList.length === 1 && renderList.length !== dataList.length) {
         renderLength.current = getRenderLength(); // 获取一次渲染多少个row
         setRenderList(getRenderList(dataList, renderLength.current)); // 获取渲染数据
       }
     }, [renderList]);

     return (
       <div
         className="virtual_scroll_container"
         onScroll={(e) => handleTableScroll(e)}
       >
         <div
           className="virtual_scroll"
           style={{ transform: `translateY(${offSetY}px)` }}
         >
           {renderList.map((item: string, index) => (
             <div
               className="virtual_scroll_row"
               key={"virtual_scroll_row" + index}
             >
               {item}
             </div>
           ))}
         </div>
       </div>
     );
   }

   export default VirtualScrollList;
   ```

   这样我们就把第一次需要展示的数据给渲染出来了。其中:

   ```ts
   // 获取虚拟列表展示的数据
   const getRenderList: <T>(
     list: T[],
     renderLength: number,
     start?: number
   ) => T[] = (list, renderLength, start) => {
     start = start || 0;
     return list.slice(start, start + renderLength);
   };
   ```

   这个方法用到了 TS 里面的`泛型`和`函数重载`,`<T>`就表示一个泛型，这样定义之后`list`这个数组中的`item`值可以是任意的。
   然后`=> T[]`这里定义了函数的返回值。这样使用这个函数的时候，只要你定义了入参中`item`的类型，编辑器也会提醒你返回值中`item`的类型。

2. <h5>实现虚拟滚动</h5>下一步我们需要列表在滚动中的时候不断获取卷起的高度并赋值给`offSetY`同时根据卷起的高度获取相应的`renderList`以实现虚拟滚动。将`handleTableScroll`方法改成这样就 ok 了。

   ```ts
   const handleTableScroll = (e: React.UIEvent<HTMLDivElement>): void => {
     const scrollTop: number = (e.target as HTMLDivElement).scrollTop;
     const offSetY: number = scrollTop; // 卷起的高度
     const offsetItemNumber: number = Math.floor(
       scrollTop / rowNodeHeight.current
     ); // 应该从第几个数据开始渲染
     const renderList = getRenderList(
       dataList,
       renderLength.current,
       offsetItemNumber
     );

     setOffSetY(offSetY);
     setRenderList(renderList);
   };
   ```

   但是这时候我们会发现一个问题，列表虽然是能够实现虚拟滚动了，但是他看起来并没有滚起来，列表项是一个一个蹦出来，就像下面这样

   <div style="text-align: left">
   <img src="https://tp-1252931931.cos.ap-chengdu.myqcloud.com/virtual-img1.gif" width="320"  alt=""/>
   </div>

   这是因为我们往上卷多少就往下平移多少的话，那整个列表就相当于没有滚动，只是随着滚轮的滑动，我们更新了渲染的数据。所以列表项就会一个一个的蹦出来。

   解决这个问题的办法其实也很简单，我们只需要在列表往上卷起刚好一项的高度的时候再更新往下的平移量，这样列表就会在一项的高度内进行滚动，当刚好滚动了一个项的高度的时候，列表会进行无感更新渲染数据。要是实现这个功能我们只需要在`handleTableScroll`方法中对`offSetY`的取值做一点小改动就好了：

   ```ts
   const handleTableScroll = (e: React.UIEvent<HTMLDivElement>): void => {
     const scrollTop: number = (e.target as HTMLDivElement).scrollTop;
     const offSetY: number = scrollTop - (scrollTop % rowNodeHeight.current); // 卷起的高度减去卷起高度和单项高度的余数
     const offsetItemNumber: number = Math.floor(
       scrollTop / rowNodeHeight.current
     ); // 应该从第几个数据开始渲染
     const renderList = getRenderList(
       dataList,
       renderLength.current,
       offsetItemNumber
     );

     setOffSetY(offSetY);
     setRenderList(renderList);
   };
   ```

   这样我们就可以保证列表在一项高度的范围内滑动的时候每次滑动获取到的`offSetY`是一致的，只有在滑动到下一项的时候才会更新`offSetY`。

   现在我们就可以丝滑的滑动列表了：

   <div style="text-align: left">
   <img src="https://tp-1252931931.cos.ap-chengdu.myqcloud.com/IMG_2962.GIF" width="320"  alt=""/>
   </div>

3. <h5>支持分页</h5>在实际需求中，列表的数据一般都是分页获取的。而目前我们的组件是还不支持分页的。当`dataList`改变的时候，列表的滚动会被重置。所以会出现一加载数据列表就会回到顶部的情况。

   要解决这个问题，我们需要在列表滚动的时候将列表的滚动高度记录下来，当列表的滚动被重置时，再将这个值重新赋给列表。

   新增两个 useRef 用来储存列表节点和列表卷起的高度:

   ```ts
   const containerRef = useRef<HTMLDivElement | null>();
   const scrollTopData = useRef<number>(0); // 卷起的高度
   ```

   将依赖`dataList`的`useEffect`做如下改造:

   ```ts
   useEffect(() => {
     // 如果有节点高度和数量数据，就不用先渲染一行
     if (renderLength.current && rowNodeHeight.current) {
       // 设置该渲染那些节点
       const offsetItemNumber: number = Math.floor(
         scrollTopData.current / rowNodeHeight.current
       );
       setRenderList(
         getRenderList(dataList, renderLength.current, offsetItemNumber)
       );
       // 将上次卷起的高度设置上去
       if (containerRef.current) {
         containerRef.current.scrollTop = scrollTopData.current;
       }
     } else {
       // 没有能渲染多少个和单行多高的信息，先渲染一行获取信息
       setRenderList(dataList.slice(0, 1)); // 先渲染一个
     }
   }, [dataList]);
   ```

   在滚动的时候更新`scrollTopData`,改造后的`handleTableScroll`如下:

   ```ts
   const handleTableScroll = (e: React.UIEvent<HTMLDivElement>): void => {
     const scrollTop: number = (e.target as HTMLDivElement).scrollTop;
     const offSetY: number = scrollTop - (scrollTop % rowNodeHeight.current); // 卷起的高度减去卷起高度和单项高度的余数
     const offsetItemNumber: number = Math.floor(
       scrollTop / rowNodeHeight.current
     ); // 应该从第几个数据开始渲染
     if (containerRef.current) {
       scrollTopData.current = scrollTop;
     }
     const renderList = getRenderList(
       dataList,
       renderLength.current,
       offsetItemNumber
     );

     setOffSetY(offSetY);
     setRenderList(renderList);
   };
   ```

   增加判断是否滑动到底部的方法函数:

   ```ts
   // 是否滑动到了底部
   const getIsScrollToBottom = (offset: number) => {
     const containerNode: HTMLDivElement | null = document.querySelector(
       ".virtual_scroll_container"
     );
     if (containerNode) {
       const offsetBottom =
         containerNode.scrollHeight -
         containerNode.scrollTop -
         containerNode.clientHeight;
       return offsetBottom <= offset;
     }
     return false;
   };
   ```

   将依赖`renderList`的`useEffect`中判断是否滑动到底部，到底部后更新`dataList`:

   ```ts
   useEffect(() => {
     // 渲染一行后获取一页能渲染多少个以及单行的高度
     if (renderList.length === 1 && renderList.length !== dataList.length) {
       renderLength.current = getRenderLength(); // 获取一次渲染多少个row
       setRenderList(getRenderList(dataList, renderLength.current)); // 获取渲染数据
     } else {
       // 更新是否滑动到底部
       const isScrollToBottom: boolean = getIsScrollToBottom(50);
       if (isScrollToBottom) {
         setTimeout(() => {
           setDataList(dataList.concat(getTestData(20)));
         }, 1000);
       }
     }
   }, [renderList]);
   ```

   将无依赖的`useEffect`做如下改造:

   ```ts
   useEffect(() => {
     setDataList(getTestData(20));
   }, []);
   ```

   现在，我们的组件就支持分页了:

   <div style="text-align: left">
      <img src="https://tp-1252931931.cos.ap-chengdu.myqcloud.com/kv8m0-q2p9d.gif" width="320"  alt=""/>
   </div>

4. <h5>组件化</h5>作为一个通用组件，我们还需要做一些改造，才能让其通用起来：

   定义组件接受的参数:

   ```ts
   interface VirtualScrollListProps<T> {
     dataList: T[]; // 所有数据
     renderItem: (item: T, index: number) => JSX.Element; // 渲染每一项的方法
     offset?: number; // 是否触底的距离
     onScroll?: (e: React.UIEvent<HTMLDivElement>) => void; // 滚动时的回调
     onScrollBottom?: () => void; // 触底时的回调
   }
   ```

   删除无依赖的`useEffect`；删除`dataList`的`useState`；删除`getTestData`方法。

   将`props`加进组件里面:

   ```ts
   function VirtualScrollList<T>({
     dataList,
     renderItem,
     onScrollBottom,
     onScroll,
     offset = 50,
   }: VirtualScrollListProps<T>);
   ```

   改写依赖`renderList`的`useEffect`,在滚动到底部的时候执行`onScrollBottom`的回调:

   ```ts
   useEffect(() => {
     // 渲染一行后获取一页能渲染多少个以及单行的高度
     if (renderList.length === 1 && renderList.length !== dataList.length) {
       renderLength.current = getRenderLength(); // 获取一次渲染多少个row
       setRenderList(getRenderList(dataList, renderLength.current)); // 获取渲染数据
     } else {
       // 更新是否滑动到底部
       const isScrollToBottom: boolean = getIsScrollToBottom(50);
       if (isScrollToBottom && onScrollBottom) {
         onScrollBottom();
       }
     }
   }, [renderList]);
   ```

   改写`handleTableScroll`,在滚动的时候执行`onScroll`的回调

   ```ts
   const handleTableScroll = (e: React.UIEvent<HTMLDivElement>): void => {
     const scrollTop: number = (e.target as HTMLDivElement).scrollTop;
     const offSetY: number = scrollTop - (scrollTop % rowNodeHeight.current); // 卷起的高度减去卷起高度和单项高度的余数
     const offsetItemNumber: number = Math.floor(
       scrollTop / rowNodeHeight.current
     ); // 应该从第几个数据开始渲染
     if (containerRef.current) {
       scrollTopData.current = scrollTop;
     }
     const renderList = getRenderList(
       dataList,
       renderLength.current,
       offsetItemNumber
     );

     setOffSetY(offSetY);
     setRenderList(renderList);

     if (onScroll) {
       onScroll(e);
     }
   };
   ```

   `return`JSX 的时候，调用`renderItem`生成每一项的 JSX 内容:

   ```tsx
   <div className="virtual_scroll_row" key={"virtual_scroll_row" + index}>
     {renderItem(item, index)}
   </div>
   ```

   现在我们这个虚拟滚动的组件基本上就封装完成了，完成后的代码如下：

   ```tsx
   import React, { useState, useEffect, useRef } from "react";
   import "./index.css";

   const redundancy = 4; // 冗余量 渲染节点数 = 一页能渲染多少个节点 + 冗余量

   // 获取虚拟列表展示的数据
   const getRenderList: <T>(
     list: T[],
     renderLength: number,
     start?: number
   ) => T[] = (list, renderLength, start) => {
     start = start || 0;
     return list.slice(start, start + renderLength);
   };

   interface VirtualScrollListProps<T> {
     dataList: T[]; // 所有数据
     renderItem: (item: T, index: number) => JSX.Element; // 渲染每一项的方法
     offset?: number; // 是否触底的距离
     onScroll?: (e: React.UIEvent<HTMLDivElement>) => void; // 滚动时的回调
     onScrollBottom?: () => void; // 触底时的回调
   }

   // 是否滑动到了底部
   const getIsScrollToBottom = (offset: number) => {
     const containerNode: HTMLDivElement | null = document.querySelector(
       ".virtual_scroll_container"
     );
     if (containerNode) {
       const offsetBottom =
         containerNode.scrollHeight -
         containerNode.scrollTop -
         containerNode.clientHeight;
       return offsetBottom <= offset;
     }
     return false;
   };

   function VirtualScrollList<T>({
     dataList,
     renderItem,
     onScrollBottom,
     onScroll,
     offset = 50,
   }: VirtualScrollListProps<T>) {
     const [renderList, setRenderList] = useState<T[]>([]); // 需要渲染的数据
     const [offSetY, setOffSetY] = useState<number>(0); // 向下的偏移量

     // 不会触发渲染的变量推荐用useRef进行维护
     const containerRef = useRef<HTMLDivElement | null>();
     const scrollTopData = useRef<number>(0); // 卷起的高度
     const renderLength = useRef<number>(0); // 一页能渲染多少个节点
     const rowNodeHeight = useRef<number>(0); // 一个节点有多高

     // 获取虚拟列表渲染多少个
     const getRenderLength = (): number => {
       const containerNode: HTMLDivElement | null = document.querySelector(
         ".virtual_scroll_container"
       );
       const rowNode: HTMLDivElement | null = document.querySelector(
         ".virtual_scroll_row"
       );
       if (containerNode && rowNode) {
         rowNodeHeight.current = rowNode.clientHeight;
         return (
           Math.ceil(containerNode.clientHeight / rowNodeHeight.current) +
           redundancy
         ); // 一页能渲染多少个节点 + 冗余量
       }
       return 0;
     };

     const handleTableScroll = (e: React.UIEvent<HTMLDivElement>): void => {
       const scrollTop: number = (e.target as HTMLDivElement).scrollTop;
       const offSetY: number = scrollTop - (scrollTop % rowNodeHeight.current); // 卷起的高度减去卷起高度和单项高度的余数
       const offsetItemNumber: number = Math.floor(
         scrollTop / rowNodeHeight.current
       ); // 应该从第几个数据开始渲染
       if (containerRef.current) {
         scrollTopData.current = scrollTop;
       }
       const renderList = getRenderList(
         dataList,
         renderLength.current,
         offsetItemNumber
       );

       setOffSetY(offSetY);
       setRenderList(renderList);

       if (onScroll) {
         onScroll(e);
       }
     };

     useEffect(() => {
       // 如果有节点高度和数量数据，就不用先渲染一行
       if (renderLength.current && rowNodeHeight.current) {
         // 设置该渲染那些节点
         const offsetItemNumber: number = Math.floor(
           scrollTopData.current / rowNodeHeight.current
         );
         setRenderList(
           getRenderList(dataList, renderLength.current, offsetItemNumber)
         );
         // 将上次卷起的高度设置上去
         if (containerRef.current) {
           containerRef.current.scrollTop = scrollTopData.current;
         }
       } else {
         // 没有能渲染多少个和单行多高的信息，先渲染一行获取信息
         setRenderList(dataList.slice(0, 1)); // 先渲染一个
       }
     }, [dataList]);

     useEffect(() => {
       // 渲染一行后获取一页能渲染多少个以及单行的高度
       if (renderList.length === 1 && renderList.length !== dataList.length) {
         renderLength.current = getRenderLength(); // 获取一次渲染多少个row
         setRenderList(getRenderList(dataList, renderLength.current)); // 获取渲染数据
       } else {
         // 更新是否滑动到底部
         const isScrollToBottom: boolean = getIsScrollToBottom(offset);
         if (isScrollToBottom && onScrollBottom) {
           onScrollBottom();
         }
       }
     }, [renderList]);

     return (
       <div
         className="virtual_scroll_container"
         onScroll={(e) => handleTableScroll(e)}
       >
         <div
           className="virtual_scroll"
           style={{ transform: `translateY(${offSetY}px)` }}
         >
           {renderList.map((item: T, index) => (
             <div
               className="virtual_scroll_row"
               key={"virtual_scroll_row" + index}
             >
               {renderItem(item, index)}
             </div>
           ))}
         </div>
       </div>
     );
   }

   export default VirtualScrollList;
   ```

   使用组件的地方代码如下:

   ```tsx
   import React, { useState } from "react";
   import "./App.css";
   import VirtualScrollList from "./components/virtual-scroll-list";

   const getTestData = (length: number): string[] => {
     let dataList: string[] = [];
     for (let i = 0; i < length; i++) {
       dataList = [...dataList, `测试数据${Math.ceil(Math.random() * 10)}`];
     }
     return dataList;
   };

   function App() {
     const [dataList, setDataList] = useState<string[]>([]);

     const handleOnScrollBottom = () => {
       setTimeout(() => {
         setDataList(dataList.concat(getTestData(20)));
       }, 1000);
     };

     return (
       <div className="App">
         <div className="list">
           <VirtualScrollList
             dataList={dataList}
             renderItem={(item, index) => <span>{item}</span>}
             onScrollBottom={() => {
               handleOnScrollBottom();
             }}
             onScroll={(e) => {
               console.log(e);
             }}
             offset={60}
           />
         </div>
       </div>
     );
   }

   export default App;
   ```

最后可以在这个仓库里面查看完整的代码: https://github.com/koko2333/react-virtual-scroll-list
