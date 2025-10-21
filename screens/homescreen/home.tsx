import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, StyleSheet, Alert } from 'react-native';
import Navbar from '../../component/navbar';
import MainPage from './mainpage';
// NOTE: fix the filename if it was misspelled: './searchbar' instead of './serachbar'
import SearchBar from './serachbar';
import Colors from '../../theme/colorpallete';

const Home: React.FC = () => {
  return (
    <>

      <SearchBar placeholder="Search vendors, items..." bgcolor="#fff" />
      <MainPage />
    </>
  );
};

export default Home;

const styles = StyleSheet.create({});
