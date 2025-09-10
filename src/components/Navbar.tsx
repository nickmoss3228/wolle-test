import { useState } from 'react';
import "../App.css"
import { FaBars } from "react-icons/fa6";
import Sidebutton from './Sidebutton';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

    const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <nav className="min-h-min m-6 p-3 text-center border-b border-gray-400">
        <div className='absolute cursor-pointer' onClick={()=>toggleMenu()}>
          <FaBars size={'20px'}/>
            </div>
            
        <span className='text-3xl font-bold tracking-widest'>
            BESIDER
        </span>

          {isOpen && (
            <Sidebutton handleClose={handleClose} /> 
          )}
      </nav>
    </>
  )
}

export default Navbar