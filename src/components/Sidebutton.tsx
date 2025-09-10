import { IoCloseOutline } from "react-icons/io5";

const Sidebutton = ({ handleClose }) => {
  const links = ['SCIENCE', 'GENERAL', 'ENTERTAINMENT', 'TECHNOLOGY', 'BUSINESS', 'HEALTH', 'SPORTS']
  return (
    <>
      <div className='fixed top-0 left-0 z-100 h-full w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out'>
        <div onClick={handleClose} className='absolute right-0'>
          <IoCloseOutline size={50}/>
        </div>

        <div className='flex flex-col justify-center items-start p-4 overflow-y-auto h-full pb-20 text-left'>
          {links.map((category, index) => (
            <div key={index} className='mb-6'>
              <h3 className='font-bold text-lg text-left'>{category}</h3>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}

export default Sidebutton