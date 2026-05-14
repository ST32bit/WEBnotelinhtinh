<?php
// database/migrations/2024_01_01_000001_create_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('users');
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255)->unique();
            $table->string('username', 100)->unique();
            $table->string('display_name', 150);
            $table->string('password', 255);                    // bcrypt hash
            $table->text('avatar')->nullable();
            $table->string('bio', 255)->default('');
            $table->string('accent_color', 100)->default('from-indigo-500 to-violet-600');
            // Tiêu chí 2: Kích hoạt tài khoản
            $table->boolean('is_active')->default(false);
            $table->string('activation_token', 255)->nullable();
            $table->dateTime('activation_expiry')->nullable();
            // Tiêu chí 4: Reset mật khẩu
            $table->string('reset_token', 255)->nullable();
            $table->dateTime('reset_expiry')->nullable();
            // Tiêu chí 8: Preferences
            $table->json('preferences')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
