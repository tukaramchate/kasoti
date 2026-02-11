package com.tukaram.kasoti;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class KasotiApplication {

	public static void main(String[] args) {
		SpringApplication.run(KasotiApplication.class, args);
	}

}
