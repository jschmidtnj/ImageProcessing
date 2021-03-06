/**********************************************************************************
* imageproc.c
* Usage: imageproc in_file_name out_file_name width height
 **********************************************************************************/

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>

#include "CImg.h"
using namespace cimg_library;

int main(int argc, char *argv[])
{
	FILE *in, *out;
	int filter[3][3];
	int j, k, width, height;
	int **image_in, **image_out;
	int l, m;

	if (argc < 5)
	{
		printf("ERROR: Insufficient parameters!\n");
		return (1);
	}

	width = atoi(argv[3]);
	height = atoi(argv[4]);

	image_in = (int **)calloc(height, sizeof(int *));
	if (!image_in)
	{
		printf("Error: Can't allocate memmory!\n");
		return (1);
	}

	image_out = (int **)calloc(height, sizeof(int *));
	if (!image_out)
	{
		printf("Error: Can't allocate memmory!\n");
		return (1);
	}

	for (j = 0; j < height; j++)
	{
		image_in[j] = (int *)calloc(width, sizeof(int));
		if (!image_in[j])
		{
			printf("Error: Can't allocate memmory!\n");
			return (1);
		}

		image_out[j] = (int *)calloc(width, sizeof(int));
		if (!image_out[j])
		{
			printf("Error: Can't allocate memmory!\n");
			return (1);
		}
	}

	if ((in = fopen(argv[1], "rb")) == NULL)
	{
		printf("ERROR: Can't open in_file!\n");
		return (1);
	}

	if ((out = fopen(argv[2], "wb")) == NULL)
	{
		printf("ERROR: Can't open out_file!\n");
		return (1);
	}

	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
		{
			if ((image_in[j][k] = getc(in)) == EOF)
			{
				printf("ERROR: Can't read from in_file!\n");
				return (1);
			}
		}
	if (fclose(in) == EOF)
	{
		printf("ERROR: Can't close in_file!\n");
		return (1);
	}

	/* display image_in */
	CImg<int> image_disp(width, height, 1, 1, 0);
	/* CImg<type> image_name(width,height,temporal_frame_number,color_plane_number,initial_value) */

	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
		{
			image_disp(k, j, 0, 0) = image_in[j][k];
		}
	CImgDisplay disp_in(image_disp, "Image_In", 0);
	/* CImgDisplay display_name(image_displayed, "window title", normalization_factor) */

	/********************************************************************/
	/* Image Processing begins                                          */
	/********************************************************************/
	/*Create a negative of the image*/

    int sum1, sum2;
    int num1, num2;
    int avg1, avg2;
    int threshold = 128;
    int newt;
    int presetdelta = 2;

	for (j = 0; j < height; j++) {
        sum1 = 0; // less than T
        sum2 = 0; // greater than T
        num1 = 0; // num of elements
        num2 = 0;
        avg1 = 0; // computed averages
        avg2 = 0;
        for (k = 0; k < width; k++) {
			if (image_in[j][k] > threshold) {
                sum1 += image_in[j][k];
                num1++;
            } else {
                sum2 += image_in[j][k];
                num2++;
            }
		}
        if (num1 != 0)
            avg1 = sum1 / num1;
        if (num2 != 0)
            avg2 = sum2 / num2;
        newt = .5 * (avg1 + avg2);
        // printf("the new threshold is %d\n", newt);
        if (abs(newt - threshold) < presetdelta)
            break;
        else
            threshold = newt;
    }

    printf("the new threshold is %d\n", threshold);

    for (j = 0; j < height; j++)
        for (k = 0; k < width; k++) {
			if (image_in[j][k] >= threshold) {
                image_out[j][k] = 255;
            } else {
                image_out[j][k] = 0;
            }
		}

	/********************************************************************/
	/* Image Processing ends                                          */
	/********************************************************************/

	/* display image_out */
	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
		{
			image_disp(k, j, 0, 0) = image_out[j][k];
		}
	CImgDisplay disp_out(image_disp, "Image_Out", 0);

	/* save image_out into out_file in RAW format */
	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
		{
			if ((putc(image_out[j][k], out)) == EOF)
			{
				printf("ERROR: Can't write to out_file!\n");
				return (1);
			}
		}

	if (fclose(out) == EOF)
	{
		printf("ERROR: Can't close out_file!\n");
		return (1);
	}

	/* closing */
	while (!disp_in.is_closed())
		disp_in.wait();
	while (!disp_out.is_closed())
		disp_out.wait();

	for (j = 0; j < height; j++)
	{
		free(image_in[j]);
		free(image_out[j]);
	}
	free(image_in);
	free(image_out);

	return 0;
}
