"use client";
import Link from 'next/link';
import { FC, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHeart, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import './navbar.css';

const categories = [
  { name: 'Blouse', link: '/blouse' },
  { name: 'Gown', link: '/gown' },
  { name: 'Tops', link: '/tops' },
  { name: 'Skirts', link: '/skirts' },
  { name: 'Chudidhar Sets', link: '/chudidhar-sets' },
];

const NavBar: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    handleResize();  // Set initial value

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className={`nav-wrapper ${scrolled ? 'scrolled' : ''}`}>
        <nav>
          <div className="nav-container">
            <div className="nav-left">
              <Link href="/explore/store">
                <img
                  src={scrolled ? "/logo25.png" : "/logo24.png"}
                  alt="Anikaa Logo"
                  width={isMobile ? (scrolled ? 70 : 100) : scrolled ? 100 : 380}
                  height={isMobile ? (scrolled ? 50 : 50) : scrolled ? 100 : 200}
                />
              </Link>
            </div>
            <div className={`nav-right ${scrolled ? 'scrolled-right' : ''}`}>
              <Link href="/explore/account">
                <button className={`signup-button ${scrolled ? 'small' : ''}`}>SIGN IN</button>
              </Link>
              {/* <button onClick={handleSearchToggle} className={`nav-icon-button ${scrolled ? 'small' : ''}`}>
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className={`nav-icon ${scrolled ? 'small' : ''} ${isMobile && !scrolled ? 'mobile-small' : ''}`} 
                />
              </button> */}
              {/* <Link href="/wishlist">
                <FontAwesomeIcon 
                  icon={faHeart} 
                  className={`nav-icon ${scrolled ? 'small' : ''} ${isMobile && !scrolled ? 'mobile-small' : ''}`} 
                />
              </Link> */}
              <Link href="/explore/cart">
                <FontAwesomeIcon 
                  icon={faShoppingCart} 
                  className={`nav-icon ${scrolled ? 'small' : ''} ${isMobile && !scrolled ? 'mobile-small' : ''}`} 
                />
              </Link>
            </div>
          </div>
          {menuOpen && (
            <div className="mobile-menu">
              <div className="categories">
                {categories.map((category) => (
                  <Link key={category.name} href={category.link}>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default NavBar;
