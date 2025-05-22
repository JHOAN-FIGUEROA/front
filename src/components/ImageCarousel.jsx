import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { styled } from '@mui/material/styles';
import pasillo from '../img/pasillo.jpg';
import supermercado2 from '../img/supermercado2.jpg';
import supermercado3 from '../img/supermercado3.jpg';

const CarouselContainer = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: '300px',
  maxWidth: '600px',
  width: '100%',
  '& .carousel-img': {
    width: '100%',
    height: '350px',
    objectFit: 'cover',
    borderRadius: '15px',
  },

  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(2),
  },
}));

const ImageCarousel = () => {
  return (
    <CarouselContainer>
      <Carousel autoPlay infiniteLoop showThumbs={false} showStatus={false}>
        <div>
          <img src={pasillo} alt="Supermercado 1" className="carousel-img" />
        </div>
        <div>
          <img src={supermercado2} alt="Supermercado 2" className="carousel-img" />
        </div>
        <div>
          <img src={supermercado3} alt="Supermercado 3" className="carousel-img" />
        </div>
      </Carousel>
    </CarouselContainer>
  );
};

export default ImageCarousel;

