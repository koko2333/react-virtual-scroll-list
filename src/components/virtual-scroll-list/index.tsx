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
