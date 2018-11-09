# Makefile for creating c++

INC = -I ./Headers/

LIB = -lX11 -pthread

executable: imageprocessing.o
	g++ imageprocessing.o

imageprocessing.o: imageprocessing.cpp Headers/CImg.h
	g++ imageprocessing.cpp $(INC) $(LIB)

clean:
	rm imageprocessing.o a.out
