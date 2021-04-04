#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <stdint.h>
#include <math.h>

extern "C"
{
	#include <libavformat/avformat.h>
	#include <libswscale/swscale.h>
	#include <libavcodec/avcodec.h>
	#include <libavutil/mathematics.h>
	#include <libavformat/avformat.h>
	#include <libavutil/opt.h>
}

extern "C"
{
	int doubler(int x);
	int cut_video(const char* fileNameIn, const char* fileNameOut, float startTime, float endTime);
}

int doubler(int x) {
	return 2 * x;
}

AVFormatContext* inFormatContext = NULL, * outFormatContext = NULL;
AVCodec* inDecoder = NULL, * inEncoder = NULL;
AVCodecParameters* inCodecParameters = NULL;
AVStream* inVideoStream = NULL, * outVideoStream = NULL;
AVCodecContext* decoderContext = NULL, * encoderContext = NULL, * audioCodecContext = NULL;
int inVideoStreamIndex = -1;

int prepare_codecs() 
{
	for (int i = 0; i < inFormatContext->nb_streams; i++) {
		AVStream* in_stream = inFormatContext->streams[i];
		AVStream* out_stream = NULL;
		AVCodecParameters* in_codecpar = in_stream->codecpar;
		AVCodec* in_codec = avcodec_find_decoder(in_codecpar->codec_id);
		AVCodec* in_encoder = avcodec_find_encoder(in_codecpar->codec_id);

		out_stream = avformat_new_stream(outFormatContext, in_codec);
		if (!out_stream) {
			fprintf(stderr, "Failed allocating output stream\n");
			return -1;
		}

		if (in_codecpar->codec_type == AVMEDIA_TYPE_VIDEO) {
			printf("Video Codec: resolution %d x %d\n", in_codecpar->width, in_codecpar->height);
			if (inVideoStreamIndex == -1) {
				decoderContext = avcodec_alloc_context3(in_codec);
				encoderContext = avcodec_alloc_context3(in_encoder);
				if (avcodec_parameters_to_context(decoderContext, in_stream->codecpar) < 0) {
					printf("Failed to copy in_stream codecpar to codec context\n");
					return -1;
				}
				decoderContext->codec_tag = 0;
				if (avcodec_parameters_to_context(encoderContext, in_stream->codecpar) < 0) {
					printf("Failed to copy in_stream codecpar to codec context\n");
					return -1;
				}
				encoderContext->codec_tag = 0;

				if (outFormatContext->oformat->flags & AVFMT_GLOBALHEADER)
					decoderContext->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
				if (avcodec_parameters_from_context(out_stream->codecpar, encoderContext) < 0) {
					printf("Failed to copy codec context to out_stream codecpar context\n");
					return -1;
				}
				inVideoStreamIndex = i;
				inDecoder = in_codec;
				inCodecParameters = in_codecpar;
				inVideoStream = inFormatContext->streams[i];
				outVideoStream = out_stream;
				//break;
			}
		}
		else if (in_codecpar->codec_type == AVMEDIA_TYPE_AUDIO) {
			audioCodecContext = avcodec_alloc_context3(in_codec);
			if (avcodec_parameters_to_context(audioCodecContext, in_stream->codecpar) < 0) {
				printf("Failed to copy in_stream codecpar to codec context\n");
				return -1;
			}
			audioCodecContext->codec_tag = 0;
			if (outFormatContext->oformat->flags & AVFMT_GLOBALHEADER)
				audioCodecContext->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
			if (avcodec_parameters_from_context(out_stream->codecpar, audioCodecContext) < 0) {
				printf("Failed to copy codec context to out_stream codecpar context\n");
				return -1;
			}
		}
	}
}

int copy_packets(int64_t starttime, int64_t endtime)
{
	AVFrame* frame = NULL;
	AVPacket inPacket, outPacket;

	av_init_packet(&inPacket);

	if (avcodec_open2(decoderContext, inDecoder, NULL) < 0) {
		fprintf(stderr, "Error occurred when opening decoder\n");
		return -1;
	}

	AVStream* outStream = NULL;
	bool initialized = false;

	while (av_read_frame(inFormatContext, &inPacket) >= 0) {
		if (inPacket.stream_index == inVideoStreamIndex) {
			int ret;
			ret = avcodec_send_packet(decoderContext, &inPacket);
			if (ret < 0) {
				fprintf(stderr, "Error sending a packet for decoding\n");
				av_frame_free(&frame);
				return -1;
			}

			while (ret >= 0) {
				if (!(frame = av_frame_alloc()))
					return AVERROR(ENOMEM);
				ret = avcodec_receive_frame(decoderContext, frame);
				frame->pts = av_frame_get_best_effort_timestamp(frame);

				if (!initialized) {
					encoderContext->time_base = inVideoStream->time_base;

					if ((ret = avcodec_open2(encoderContext, inEncoder, NULL)) < 0) {
						fprintf(stderr, "Error occurred when opening encoder\n");
						return -1;
					}

					if (!(outStream = avformat_new_stream(outFormatContext, inEncoder))) {
						fprintf(stderr, "Failed to allocate stream for output format.\n");
						return -1;
					}

					ret = avcodec_parameters_from_context(outStream->codecpar, encoderContext);
					if (ret < 0) {
						fprintf(stderr, "Failed to copy the stream parameters.\n");
						return -1;
					}

					if ((ret = avformat_write_header(outFormatContext, NULL)) < 0) {
						fprintf(stderr, "Error while writing stream header.\n");
						return -1;
					}

					initialized = true;
				}

				if (frame->pts >= starttime && frame->pts <= endtime) {
					AVPacket enc_pkt;

					av_init_packet(&enc_pkt);
					enc_pkt.data = NULL;
					enc_pkt.size = 0;


					if ((ret = avcodec_send_frame(encoderContext, frame)) < 0) {
						fprintf(stderr, "Error during encoding.\n");
						return -1;
					}
					while (1) {
						ret = avcodec_receive_packet(encoderContext, &enc_pkt);
						if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
							//av_frame_free(&frame);
							break;
						}
						else if (ret < 0) {
							fprintf(stderr, "Error during encoding output\n");
							av_frame_free(&frame);
							return -1;
						}

						av_packet_rescale_ts(&enc_pkt, inVideoStream->time_base, outFormatContext->streams[inVideoStreamIndex]->time_base);

						if (av_write_frame(outFormatContext, &enc_pkt) != 0) {
							fprintf(stderr, "Error while writing video frame\n");
							return -1;
						}
					}
					av_packet_unref(&enc_pkt);
				}
			}

			if (frame->pts > endtime) {
				break;
			}
		}
	}
	av_packet_unref(&inPacket);
}

int cut_video(const char* fileNameIn, const char* fileNameOut, float startTime, float endTime)
{
	av_register_all();

	if (avformat_open_input(&inFormatContext, fileNameIn, NULL, NULL) < 0) {
		fprintf(stderr, "Could not open input file");
		return -1;
	}

	printf("Format %s, duration %lld us\n", inFormatContext->iformat->long_name, inFormatContext->duration);

	if (avformat_find_stream_info(inFormatContext, NULL) < 0) {
		printf("Find stream info error!\n");
		return -1;
	}

	av_dump_format(inFormatContext, 0, fileNameIn, 0);

	avformat_alloc_output_context2(&outFormatContext, NULL, NULL, fileNameOut);
	if (!outFormatContext) {
		fprintf(stderr, "Could not create output context\n");
		return -1;
	}

	if (prepare_codecs() < 0) {
		printf("Error while preparing codecs!\n");
		return -1;
	}

	av_dump_format(outFormatContext, 0, fileNameOut, 1);

	if (!(outFormatContext->oformat->flags & AVFMT_NOFILE)) {
		if (avio_open(&outFormatContext->pb, fileNameOut, AVIO_FLAG_WRITE) < 0) {
			fprintf(stderr, "Could not open output file");
			return -1;
		}
	}

	AVRational default_timebase;
	default_timebase.num = 1;
	default_timebase.den = AV_TIME_BASE;

	int64_t starttime_int64 = av_rescale_q((int64_t)(startTime * AV_TIME_BASE), default_timebase, inVideoStream->time_base);
	int64_t endtime_int64 = av_rescale_q((int64_t)(endTime * AV_TIME_BASE), default_timebase, inVideoStream->time_base);

	if (copy_packets(starttime_int64, endtime_int64) < 0) {
		printf("Error while copying packets!\n");
		return -1;
	}

	av_write_trailer(outFormatContext);

	return 0;
}


int main(int argc, const char* argv[]) {
	cut_video("test1.mp4", "cutted.mp4", 1.0, 5.0);
	return 0;
}