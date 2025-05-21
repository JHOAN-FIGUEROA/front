import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { styled } from '@mui/material/styles';
import pasillo from "../img/pasillo.jpg"
import supermercado2 from "../img/supermercado2.jpg"
import supermercado3 from "../img/supermercado3.jpg"

const CarouselContainer = styled('div')({
  width: '60%',
  margin: '10px 0 10px 40px',
  '& .carousel-img': {
    width: '99%',
    height: '350px',
    objectFit: 'cover',
    borderRadius: '15px',
  }
});

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