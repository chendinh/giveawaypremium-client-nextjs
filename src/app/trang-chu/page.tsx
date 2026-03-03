'use client';

import React from 'react';
// import { useSelector } from 'react-redux';
import HomeCarousel from './Components/HomeCarousel';

const Home = () => {
  // const userData = useSelector((state: RootState) => state.userData);

  return (
    <div className="container w-full min-h-[calc(100vh-97px)] flex flex-col items-center ">
      <HomeCarousel />
      {/* <MyModal ref={myModal} /> */}
    </div>
  );
};

export default Home;
