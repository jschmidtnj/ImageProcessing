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
	float sum1, sum2;
	float new_T, old_T, delta_T;
	long count1, count2;
	int l, m;
	float mask[3][3] = {
		{0.111111, 0.111111, 0.111111},
		{0.111111, 0.111111, 0.111111},
		{0.111111, 0.111111, 0.111111}};

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

	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
		{
			image_out[j][k] = 255 - image_in[j][k];
		}

	/*Add a filter*/

	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
		{
			if (j == 0 || j == height - 1 || k == 0 || k == width - 1)
				image_out[j][k] = image_in[j][k];
			else
			{
				sum1 = 0.0;
				for (l = 0; l < 3; l++)
					for (m = 0; m < 3; m++)
						sum1 += ((float)image_in[j + l - 1][k + m - 1]) * mask[l][m];
				if (sum1 > 255)
					sum1 = 255;
				if (sum1 < 0)
					sum1 = 0;
				image_out[j][k] = (int)sum1;
			}
		}

	/*if you want to do high pass, make the boundary 0, else if low pass copy to new image unchanged*/

	// Add Histogram equalization

	float histogram[256];		 // histogram counter
	float equalization_map[256]; // equalization mapping
	float one_pixel = 1.0 / ((float)width * height);
	int num_pixel_vals = 256;
	float max_pixel_val_float = 255.0;
	int max_pixel_val_int = 255;

	for (j = 0; j < num_pixel_vals; j++)
		histogram[j] = 0.0;

	for (j = 0; j < num_pixel_vals; j++)
		equalization_map[j] = 0.0;

	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
			histogram[image_in[j][k]] += one_pixel;

	for (j = 0; j < num_pixel_vals; j++)
	{
		for (k = 0; k < j + 1; k++)
			equalization_map[j] += histogram[k];
		equalization_map[j] = floor(equalization_map[j] * max_pixel_val_float);
	}

	for (j = 0; j < height; j++)
		for (k = 0; k < width; k++)
			image_out[j][k] = (int)equalization_map[image_in[j][k]];

	CImg<float> plot(num_pixel_vals, num_pixel_vals, 1, 1, max_pixel_val_int), vec_data(num_pixel_vals, 1, 1, 1, 0);
	const unsigned char black[] = {0};

	for (j = 0; j < num_pixel_vals; j++)
		vec_data(j, 0, 0, 0) = histogram[j];

	plot.draw_graph(vec_data, black, 1, 1, 0, 0, 0);

	CImgDisplay disp_hist(plot, "Histogram", 0);

	for (j = 0; j < num_pixel_vals; j++)
		vec_data(j, 0, 0, 0) = equalization_map[j];

	plot.fill(max_pixel_val_int).draw_graph(vec_data, black, 1, 1, 0, 0, 0);

	CImgDisplay disp_eqmap(plot, "Equalization Mapping Function", 0);

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
