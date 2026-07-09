export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "RentNest API 🏠",
    version: "1.0.0",
    description: "Backend REST API for RentNest - A Rental Property Marketplace. Supports Tenants (browsing, requesting rentals, Stripe payments, reviews), Landlords (managing listings, approving requests), and Admins (moderating users and content).",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local Server"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer <token>"
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["TENANT", "LANDLORD", "ADMIN"] },
          status: { type: "string", enum: ["ACTIVE", "BANNED"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Property: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          price: { type: "number" },
          categoryId: { type: "string", format: "uuid" },
          amenities: { type: "array", items: { type: "string" } },
          images: { type: "array", items: { type: "string" } },
          availability: { type: "boolean" },
          landlordId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      RentalRequest: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          propertyId: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "PAYMENT", "ACTIVE", "COMPLETED"] },
          totalPrice: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Payment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          transactionId: { type: "string" },
          rentalRequestId: { type: "string", format: "uuid" },
          amount: { type: "number" },
          method: { type: "string" },
          provider: { type: "string" },
          status: { type: "string", enum: ["PENDING", "COMPLETED", "FAILED"] },
          paidAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          propertyId: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", example: "tenant@example.com" },
                  password: { type: "string", example: "password123" },
                  role: { type: "string", enum: ["TENANT", "LANDLORD"], example: "TENANT" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User registered successfully" },
                    data: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "tenant@example.com" },
                  password: { type: "string", example: "password123" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                    data: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/properties": {
      get: {
        tags: ["Properties (Public)"],
        summary: "Browse available properties",
        parameters: [
          { name: "location", in: "query", schema: { type: "string" }, description: "Filter by location" },
          { name: "minPrice", in: "query", schema: { type: "number" }, description: "Minimum price" },
          { name: "maxPrice", in: "query", schema: { type: "number" }, description: "Maximum price" },
          { name: "categoryId", in: "query", schema: { type: "string" }, description: "Filter by category ID" }
        ],
        responses: {
          "200": {
            description: "Properties retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Property" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/properties/{id}": {
      get: {
        tags: ["Properties (Public)"],
        summary: "Get property details",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Property details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Property" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/categories": {
      get: {
        tags: ["Properties (Public)"],
        summary: "Get all property categories",
        responses: {
          "200": {
            description: "Categories retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Category" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/landlord/properties": {
      post: {
        tags: ["Landlord Management"],
        summary: "Create new property listing",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "description", "location", "price", "categoryId"],
                properties: {
                  title: { type: "string", example: "Luxury Studio Apartment" },
                  description: { type: "string", example: "Fully furnished apartment in the city center." },
                  location: { type: "string", example: "Banani, Dhaka" },
                  price: { type: "number", example: 500 },
                  categoryId: { type: "string", example: "category_uuid" },
                  amenities: { type: "array", items: { type: "string" }, example: ["WiFi", "Air Conditioning"] },
                  images: { type: "array", items: { type: "string" }, example: ["https://example.com/img.jpg"] }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Property listing created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Property" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/landlord/properties/{id}": {
      put: {
        tags: ["Landlord Management"],
        summary: "Update property listing",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", example: "Updated Title" },
                  price: { type: "number", example: 550 },
                  availability: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Property updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Property" }
                  }
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Landlord Management"],
        summary: "Remove property listing",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Property deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Property deleted successfully" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/landlord/requests": {
      get: {
        tags: ["Landlord Management"],
        summary: "Get received rental requests",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Requests retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/RentalRequest" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/landlord/requests/{id}": {
      patch: {
        tags: ["Landlord Management"],
        summary: "Approve or reject a request",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["APPROVED", "REJECTED"], example: "APPROVED" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Rental request status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental request has been approved" },
                    data: { $ref: "#/components/schemas/RentalRequest" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/rentals": {
      post: {
        tags: ["Rental Requests"],
        summary: "Submit a rental request (Tenant)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["propertyId", "startDate", "endDate"],
                properties: {
                  propertyId: { type: "string", example: "property_uuid" },
                  startDate: { type: "string", format: "date-time", example: "2026-08-01T12:00:00Z" },
                  endDate: { type: "string", format: "date-time", example: "2026-08-10T12:00:00Z" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Rental request submitted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Rental request submitted successfully" },
                    data: { $ref: "#/components/schemas/RentalRequest" }
                  }
                }
              }
            }
          }
        }
      },
      get: {
        tags: ["Rental Requests"],
        summary: "Get tenant's rental requests",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Rental history retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/RentalRequest" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/rentals/{id}": {
      get: {
        tags: ["Rental Requests"],
        summary: "Get rental request details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Rental request retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/RentalRequest" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/payments/create": {
      post: {
        tags: ["Payments"],
        summary: "Create a payment intent/session for an approved rental",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalRequestId"],
                properties: {
                  rentalRequestId: { type: "string", example: "request_uuid" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Stripe payment session created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    sessionUrl: { type: "string", example: "https://checkout.stripe.com/..." },
                    sessionId: { type: "string", example: "cs_test_..." }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/payments/confirm": {
      post: {
        tags: ["Payments"],
        summary: "Confirm/verify payment (webhook or callback simulation)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rentalRequestId", "transactionId"],
                properties: {
                  rentalRequestId: { type: "string", example: "request_uuid" },
                  transactionId: { type: "string", example: "tx_simulated_id" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Payment confirmed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Payment confirmed successfully. Rental request is now ACTIVE." },
                    data: { $ref: "#/components/schemas/Payment" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/payments": {
      get: {
        tags: ["Payments"],
        summary: "Get user's payment history",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Payment history retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Payment" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/payments/{id}": {
      get: {
        tags: ["Payments"],
        summary: "Get payment details",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "Payment details retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Payment" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/reviews": {
      post: {
        tags: ["Reviews"],
        summary: "Create review (after completed rental)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["propertyId", "rating", "comment"],
                properties: {
                  propertyId: { type: "string", example: "property_uuid" },
                  rating: { type: "integer", example: 5 },
                  comment: { type: "string", example: "Excellent property and landlord! Highly recommended." }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Review created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Review created successfully" },
                    data: { $ref: "#/components/schemas/Review" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all users",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Users list retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/User" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/users/{id}": {
      patch: {
        tags: ["Admin"],
        summary: "Update user status (ban/unban)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["ACTIVE", "BANNED"], example: "BANNED" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "User status updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User account is now banned" },
                    data: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/properties": {
      get: {
        tags: ["Admin"],
        summary: "Get all properties",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "All properties retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/Property" } }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/admin/rentals": {
      get: {
        tags: ["Admin"],
        summary: "Get all rental requests",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "All rental requests retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "array", items: { $ref: "#/components/schemas/RentalRequest" } }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};