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
        {VirtualScrollList<string>({
          dataList,
          renderItem: (item, index) => <span>{item}</span>,
          onScrollBottom: () => {
            handleOnScrollBottom();
          },
          onScroll: (e) => {
            console.log(e);
          },
          offset:60
        })}
      </div>
    </div>
  );
}

export default App;
