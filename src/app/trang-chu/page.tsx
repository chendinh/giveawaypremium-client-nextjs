import React from 'react';
import HomeCarousel from './Components/HomeCarousel';

const Home = () => {
  return (
    <div className="container w-full min-h-[calc(100vh-97px)] flex flex-col items-center ">
      <HomeCarousel />
    </div>
  );
};

export default Home;
